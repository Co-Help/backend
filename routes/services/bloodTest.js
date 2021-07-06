const router = require("express").Router();

const { check_for_access_token, allowAll } = require("../../middlewares/auth");
const { HandleError, NOTFOUND, ERROR } = require("../../utils/error");

const UserModel = require("../../db/models/user");
// const OrgModel = require("../../db/models/org");
const BloodTestModel = require("../../db/models/services/bloodTest");
const ConfigModel = require("../../db/models/config");
const { getBookingConstrains } = require("../../utils");
const { sendMail } = require("../../utils/email");
const { GET_HTML, bold } = require("../../utils/template");

router.get("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const findByOrg = req.query?.org ? true : false;
    let blood_tests = [];
    let filtered_blood_tests = [];

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    const timeContraints = { test_date: { $gt: Date.now() } };

    if (findByCity) {
      blood_tests = await BloodTestModel.find({
        booked: false,
        ...timeContraints,
      }).populate(orgContrains);

      blood_tests = blood_tests.filter(
        (item) => item.org.address.city === req.query.city
      );
    } else if (findByDistrict) {
      blood_tests = await BloodTestModel.find({
        booked: false,
        ...timeContraints,
      }).populate(orgContrains);

      blood_tests = blood_tests.filter(
        (item) => item.org.address.district === req.query.district
      );
    } else if (findByOrg) {
      blood_tests = await BloodTestModel.find({
        org: req.query.org,
        booked: false,
        ...timeContraints,
      }).populate(orgContrains);
    } else {
      blood_tests = await BloodTestModel.find({
        booked: false,
        ...timeContraints,
      }).populate(orgContrains);
    }

    blood_tests.forEach((item) => {
      const is_exists = filtered_blood_tests.find(
        (fItem) => item.batch_code === fItem.batch_code
      );

      if (!is_exists) {
        filtered_blood_tests.push(item);
      }
    });

    return res.status(200).json({
      message: "Successful operation",
      services: filtered_blood_tests,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");
    if (!user.is_profile_completed) throw new ERROR("Profile is not completed");

    const is_batch_code_exists = req.body?.batch_code ? true : false;
    if (!is_batch_code_exists) throw new NOTFOUND("batch_code");

    const bookingConstrains = getBookingConstrains(req.body, user);

    const ret = await BloodTestModel.findOneAndUpdate(
      { batch_code: req.body.batch_code, booked: false },
      {
        patient: user,
        booking_date: Date.now(),
        booked: true,
        ...bookingConstrains,
      }
    ).populate("org");
    if (!ret) throw new ERROR("Error Ocurred", 500, { err: ret });

    await sendMail(
      req.user.email,
      "CoHelp Blood Test Services",
      "",
      GET_HTML(
        "Successfully Booked",
        false,
        `You successfully booked your blood test from ${bold(
          ret.org.name
        )}.\nTest Time : ${bold(
          new Date(ret.test_date).toLocaleString()
        )}. \nPlace : ${bold(
          ret.org.address.city +
            ", " +
            ret.org.address.district +
            ", " +
            ret.org.address.state +
            ", " +
            ret.org.address.pinCode
        )}.\n\nFor any query our helpline no. ${bold(ret.org.helpline_no)}`,
        {
          Name: bookingConstrains.patient_details.name,
          Age: bookingConstrains.patient_details.age,
          Mobile: bookingConstrains.patient_details.mobile_no,
        }
      )
    );

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.get("/booked", check_for_access_token, allowAll, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    const blood_tests = await BloodTestModel.find({
      patient: user,
    }).populate(orgContrains);

    return res.status(200).json({
      message: "Successful operation",
      services: blood_tests,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    const is_id_given = req.body?.id ? true : false;
    if (!is_id_given) throw new NOTFOUND("id (blood_test_id)");

    const record = await BloodTestModel.findOne({
      _id: req.body.id,
      done: false,
      patient: user,
    }).populate("org");
    if (!record) throw new NOTFOUND("Model");

    const config = await ConfigModel.findOne({ batch_code: record.batch_code });
    if (!config) throw new NOTFOUND("Config");

    const patient_name = record.patient_details.name;

    record.patient = null;
    record.booked = false;
    record.booking_date = null;
    record.patient_details = null;
    record.cost = config.cost;
    record.test_date = config.date;
    record.info = config.info;
    await record.save();

    await sendMail(
      req.user.email,
      "CoHelp Blood Test Services",
      "",
      GET_HTML(
        "Booking Cancelled",
        false,
        `Your blood test booking cancelled which is booked from ${bold(
          record.org.name
        )} for ${bold(patient_name)}.\n\nFor any query our helpline no. ${bold(
          record.org.helpline_no
        )}`
      )
    );

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
