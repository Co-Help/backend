const router = require("express").Router();

const { check_for_access_token, allowAll } = require("../../middlewares/auth");
const { HandleError, NOTFOUND, ERROR } = require("../../utils/error");

const UserModel = require("../../db/models/user");
// const OrgModel = require("../../db/models/org");
const ServiceModel = require("../../db/models/services/oxygenProvide");
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
    let services = [];
    let filtered_services = [];

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    if (findByCity) {
      services = await ServiceModel.find({ booked: false }).populate(
        orgContrains
      );

      services = services.filter(
        (item) => item.org.address.city === req.query.city
      );
    } else if (findByDistrict) {
      services = await ServiceModel.find({ booked: false }).populate(
        orgContrains
      );

      services = services.filter(
        (item) => item.org.address.district === req.query.district
      );
    } else if (findByOrg) {
      services = await ServiceModel.find({
        org: req.query.org,
        booked: false,
      }).populate(orgContrains);
    } else {
      services = await ServiceModel.find({
        booked: false,
      }).populate(orgContrains);
    }

    services.forEach((item) => {
      const is_exists = filtered_services.find(
        (fItem) => item.batch_code === fItem.batch_code
      );

      if (!is_exists) {
        filtered_services.push(item);
      }
    });

    return res.status(200).json({
      message: "Successful operation",
      services: filtered_services,
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

    const quantity =
      req.body?.quantity && typeof req.body?.quantity === "number"
        ? req.body.quantity
        : 1;

    const available = await ServiceModel.countDocuments({
      batch_code: req.body.batch_code,
      booked: false,
    });

    if (available < quantity) {
      throw new ERROR("Requested amount of Oxygen is not available.", 400, {
        in_stock: available,
      });
    }

    const update = {
      buyer: user._id,
      booking_date: Date.now(),
      booked: true,
      ...bookingConstrains,
    };

    let tmp;

    for (let i = 0; i < quantity; i++) {
      const ret = await ServiceModel.findOneAndUpdate(
        { batch_code: req.body.batch_code, booked: false },
        update
      ).populate(i === 0 ? "org" : "");

      if (!ret && i === 0) {
        throw new ERROR("Out of stock");
      }

      if (i === 0) {
        tmp = ret;
      }
    }

    EMAIL_JOB.push_email({
      email: req.user.email,
      subject: "CoHelp Oxygen Services",
      content: "",
      html: GET_HTML(
        "Oxygen Booked",
        false,
        `You successfully booked oxygen from ${bold(
          tmp.org.name
        )}.\n\nFor any query, our helpline no. ${bold(tmp.org.helpline_no)}`,
        {
          Name: bookingConstrains.patient_details.name,
          Age: bookingConstrains.patient_details.age,
          Mobile: bookingConstrains.patient_details.mobile_no,
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

    const services = await ServiceModel.find({
      buyer: user,
    }).populate(orgContrains);

    let filtered_services = [];

    services.forEach((item) => {
      const {
        cost,
        capacity,
        org,
        done,
        booked,
        buyer,
        booking_date,
        info,
        batch_code,
        patient_details,
      } = item;
      const exists = filtered_services.find((fItem) => {
        return (
          item.booking_date.toISOString() ===
            fItem.booking_date.toISOString() &&
          item.buyer.toString() === fItem.buyer.toString()
        );
      });
      if (exists) {
        filtered_services = filtered_services.map((fItem) => {
          fItem.qty =
            item.booking_date.toISOString() ===
              fItem.booking_date.toISOString() &&
            item.buyer.toString() === fItem.buyer.toString()
              ? fItem.qty + 1
              : fItem.qty;
          return fItem;
        });
      } else {
        filtered_services.push({
          cost,
          capacity,
          org,
          done,
          booked,
          buyer,
          booking_date,
          info,
          batch_code,
          patient_details,
          qty: 1,
        });
      }
    });

    return res.status(200).json({
      message: "Successful operation",
      services: filtered_services,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    const is_booking_date_given = req.body?.booking_date ? true : false;
    if (!is_booking_date_given) throw new NOTFOUND("booking_date");

    let record = await ServiceModel.findOne({
      booking_date: req.body.booking_date,
      done: false,
      buyer: user,
    }).populate("org");
    if (!record) throw new NOTFOUND("Model");

    const config = await ConfigModel.findOne({ batch_code: record.batch_code });
    if (!config) throw new NOTFOUND("Config");

    const ret = await ServiceModel.updateMany(
      { booking_date: req.body.booking_date, done: false, buyer: user },
      {
        buyer: null,
        booked: false,
        booking_date: null,
        patient_details: null,
        cost: config.cost,
        capacity: config.capacity,
        info: config.info,
      }
    );

    if (!ret)
      throw new ERROR("Booked record not found or its already finished");

    EMAIL_JOB.push_email({
      email: req.user.email,
      subject: "CoHelp Oxygen Services",
      content: "",
      html: GET_HTML(
        "Booking Cancelled",
        false,
        `Oxygen booking cancelled which is booked from ${bold(
          record.org.name
        )} for ${bold(
          record.patient_details.name
        )}.\n\nFor any query our helpline no. ${bold(record.org.helpline_no)}`
      ),
    });

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
