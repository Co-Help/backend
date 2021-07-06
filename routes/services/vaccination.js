const router = require("express").Router();

const { check_for_access_token, allowAll } = require("../../middlewares/auth");
const { HandleError, NOTFOUND, ERROR } = require("../../utils/error");

const UserModel = require("../../db/models/user");
// const OrgModel = require("../../db/models/org");
const VaccinationModel = require("../../db/models/services/vaccination");
const ConfigModel = require("../../db/models/config");
const { getBookingConstrains } = require("../../utils");
const { GET_HTML, bold } = require("../../utils/template");

const EMAIL_JOB = require("../../worker/email");
EMAIL_JOB.start();

router.get("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const findByOrg = req.query?.org ? true : false;
    const dozeProvided = req.query?.doze ? true : false;
    let vaccines = [];
    let filtered_vaccines = [];

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    const dozeConstrains = dozeProvided ? { vaccine_doze: req.query.doze } : {};
    const timeContraints = { vaccine_date: { $gt: Date.now() } };

    if (findByCity) {
      vaccines = await VaccinationModel.find({
        booked: false,
        ...dozeConstrains,
        ...timeContraints,
      }).populate(orgContrains);

      vaccines = vaccines.filter(
        (item) => item.org.address.city === req.query.city
      );
    } else if (findByDistrict) {
      vaccines = await VaccinationModel.find({
        booked: false,
        ...dozeConstrains,
        ...timeContraints,
      }).populate(orgContrains);

      vaccines = vaccines.filter(
        (item) => item.org.address.district === req.query.district
      );
    } else if (findByOrg) {
      vaccines = await VaccinationModel.find({
        org: req.query.org,
        booked: false,
        ...dozeConstrains,
        ...timeContraints,
      }).populate(orgContrains);
    } else {
      vaccines = await VaccinationModel.find({
        booked: false,
        ...dozeConstrains,
        ...timeContraints,
      }).populate(orgContrains);
    }

    vaccines.forEach((item) => {
      const is_exists = filtered_vaccines.find(
        (fItem) => item.batch_code === fItem.batch_code
      );

      if (!is_exists) {
        filtered_vaccines.push(item);
      }
    });

    return res.status(200).json({
      message: "Successful operation",
      services: filtered_vaccines,
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

    const bookingConstrains = getBookingConstrains(req.body, user, true);

    const ret = await VaccinationModel.findOneAndUpdate(
      { batch_code: req.body.batch_code, booked: false },
      {
        patient: user,
        booking_date: Date.now(),
        booked: true,
        ...bookingConstrains,
      }
    ).populate("org");
    if (!ret) throw new ERROR("Error Ocurred", 500, { err: ret });

    EMAIL_JOB.push_email({
      email: req.user.email,
      subject: "CoHelp Vaccination Services",
      content: "",
      html: GET_HTML(
        "Successfully Booked",
        false,
        `You successfully booked your vaccine from ${bold(
          ret.org.name
        )}.\nVaccination Date : ${bold(
          new Date(ret.vaccine_date).toLocaleString()
        )}. \nPlace : ${bold(
          ret.org.address.city +
            ", " +
            ret.org.address.district +
            ", " +
            ret.org.address.state +
            ", " +
            ret.org.address.pinCode
        )}. \nVaccine : ${bold(
          `${ret.vaccine_name} [${ret.vaccine_doze} Dose]`
        )}. \n\nFor any query our helpline no. ${bold(ret.org.helpline_no)}`,
        {
          Name: bookingConstrains.patient_details.name,
          Age: bookingConstrains.patient_details.age,
          Mobile: bookingConstrains.patient_details.mobile_no,
          Aadhar: bookingConstrains.patient_details.aadhar,
        }
      ),
    });

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

    const vaccines = await VaccinationModel.find({
      patient: user,
    }).populate(orgContrains);

    return res.status(200).json({
      message: "Successful operation",
      services: vaccines,
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
    if (!is_id_given) throw new NOTFOUND("id (vaccination_id)");

    const record = await VaccinationModel.findOne({
      _id: req.body.id,
      done: false,
      patient: user,
    }).populate("org");
    if (!record) throw new NOTFOUND("Record");

    const config = await ConfigModel.findOne({ batch_code: record.batch_code });
    if (!config) throw new NOTFOUND("Config");

    const patient_name = record.patient_details.name;

    const ret = await VaccinationModel.updateMany(
      { _id: req.body.id, done: false, patient: user },
      {
        patient: null,
        booked: false,
        booking_date: null,
        patient_details: null,
        cost: config.cost,
        capacity: config.capacity,
        info: config.info,
        min_age: config.min_age,
        max_age: config.max_age,
        vaccine_name: config.vaccine_name,
        vaccine_date: config.date,
      }
    );

    if (!ret)
      throw new ERROR("Booked record not found or its already finished");

    EMAIL_JOB.push_email({
      email: req.user.email,
      subject: "CoHelp Vaccination Services",
      content: "",
      html: GET_HTML(
        "Booking Cancelled",
        false,
        `Your vaccination booking cancelled which is booked from ${bold(
          record.org.name
        )} for ${bold(patient_name)}.\n\nFor any query our helpline no. ${bold(
          record.org.helpline_no
        )}`
      ),
    });

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
