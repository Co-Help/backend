const router = require("express").Router();
const { check_for_access_token, allowUser } = require("../../middlewares/auth");
const { HandleError, NOTFOUND, ERROR } = require("../../utils/error");
const AppointmentModel = require("../../db/models/services/appointment");
const UserModel = require("../../db/models/user");
const ConfigModel = require("../../db/models/config");
const { getBookingConstrains } = require("../../utils");
const { GET_HTML, bold } = require("../../utils/template");

const EMAIL_JOB = require("../../worker/email");
EMAIL_JOB.start();

router.get("/", check_for_access_token, allowUser, async (req, res) => {
  try {
    const findByDoctor = req.query?.doctor ? true : false;
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const findByOrg = req.query?.org ? true : false;
    let appointments = [];
    let filteredAppointments = [];

    const orgConstraints = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    const doctorConstraints = {
      path: "doctor",
      select: ["name", "avatar", "email", "doctor_info.active"],
      match: { "doctor_info.active": { $eq: true } },
    };

    const timeContraints = { appointment_date: { $gt: Date.now() } };

    if (findByDoctor) {
      appointments = await AppointmentModel.find({
        doctor: req.query.doctor,
        booked: false,
        ...timeContraints,
      })
        .populate(orgConstraints)
        .populate(doctorConstraints);
    }

    if (findByCity || findByDistrict) {
      appointments = await AppointmentModel.find({
        booked: false,
        ...timeContraints,
      })
        .populate(orgConstraints)
        .populate(doctorConstraints);

      if (findByCity) {
        appointments = appointments
          .filter((item) => item.org.address.city === req.query.city)
          .populate(doctorConstraints);
      }

      if (findByDistrict) {
        appointments = appointments
          .filter((item) => item.org.address.district === req.query.district)
          .populate(doctorConstraints);
      }
    }

    if (findByOrg) {
      appointments = await AppointmentModel.find({
        org: req.query.org,
        booked: false,
        ...timeContraints,
      })
        .populate(orgConstraints)
        .populate(doctorConstraints);
    }

    appointments = appointments.filter((item) => item.doctor !== null);

    appointments.forEach((item) => {
      const is_exists = filteredAppointments.find(
        (fItem) => item.batch_code === fItem.batch_code
      );

      if (!is_exists) {
        filteredAppointments.push(item);
      }
    });

    return res.status(200).json({
      message: "Successful operation",
      appointments: filteredAppointments,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.get("/booked", check_for_access_token, allowUser, async (req, res) => {
  try {
    const orgConstraints = [
      {
        path: "org",
        select: ["name", "logo_url", "helpline_no", "address"],
      },
      {
        path: "doctor",
        select: ["name", "avatar", "email"],
      },
    ];

    const appointments = await AppointmentModel.find({
      patient: req.user.id,
    }).populate(orgConstraints);

    return res.status(200).json({
      message: "Successful operation",
      appointments: appointments,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post("/", check_for_access_token, allowUser, async (req, res) => {
  try {
    const is_batch_code_exists = req.body?.batch_code ? true : false;

    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("User");
    if (!user.is_profile_completed) throw new ERROR("Profile is not completed");

    const bookingConstrains = getBookingConstrains(req.body, user);

    if (!is_batch_code_exists) throw new NOTFOUND("batch_code");

    const ret = await AppointmentModel.findOneAndUpdate(
      {
        batch_code: req.body.batch_code,
        booked: false,
      },
      {
        booked: true,
        patient: req.user.id,
        booking_time: Date.now(),
        ...bookingConstrains,
      }
    ).populate(["org", "doctor"]);

    if (!ret) {
      throw new ERROR("Slots of appointment is full.", 400, {
        free_slot: false,
      });
    }

    EMAIL_JOB.push_email({
      email: req.user.email,
      subject: "CoHelp Appointment Services",
      content: "",
      html: GET_HTML(
        "Appointment Booked",
        false,
        `You successfully booked your appointment from ${bold(
          ret.org.name
        )}.\nAppointment Time : ${bold(
          new Date(ret.appointment_date).toLocaleString()
        )}\nDoctor : ${bold(
          ret.doctor.name
        )}\n\nFor any query, our helpline no. ${bold(ret.org.helpline_no)}`,
        {
          Name: bookingConstrains.patient_details.name,
          Age: bookingConstrains.patient_details.age,
          Mobile: bookingConstrains.patient_details.mobile_no,
        }
      ),
    });

    return res.status(200).json({
      message: "Successful operation",
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post("/cancel", check_for_access_token, allowUser, async (req, res) => {
  try {
    const id_given = req.body?.id ? true : false;

    if (!id_given) throw new NOTFOUND("id");

    const appointment = await AppointmentModel.findOne({
      _id: req.body?.id,
      patient: req.user.id,
    });

    if (!appointment) {
      throw new ERROR("You aren't booked any appointment", 400, {
        is_booked: false,
      });
    }

    if (appointment.done) {
      throw new ERROR("You can't cancel a finished appointment", 400, {
        done: true,
      });
    }

    const record = await AppointmentModel.findOne({
      _id: req.body?.id,
      patient: req.user.id,
    }).populate("org");
    if (!record) throw new NOTFOUND("Model");

    const config = await ConfigModel.findOne({ batch_code: record.batch_code });
    if (!config) throw new NOTFOUND("Config");

    const patient_name = record.patient_details.name;

    record.patient = null;
    record.booked = false;
    record.booking_time = null;
    record.patient_details = null;
    record.cost = config.cost;
    record.appointment_date = config.date;
    record.info = config.info;
    await record.save();

    EMAIL_JOB.push_email({
      email: req.user.email,
      subject: "CoHelp Appointment Services",
      content: "",
      html: GET_HTML(
        "Booking Cancelled",
        false,
        `Your Appointment booking cancelled which is booked from ${bold(
          record.org.name
        )} for ${bold(patient_name)}.\n\nFor any query our helpline no. ${bold(
          record.org.helpline_no
        )}`
      ),
    });

    return res.status(200).json({
      message: "Successful operation",
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
