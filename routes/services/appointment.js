const router = require("express").Router();
const { check_for_access_token, allowUser } = require("../../middlewares/auth");
const { HandleError, NOTFOUND, ERROR } = require("../../utils/error");
const AppointmentModel = require("../../db/models/services/appointment");

router.get("/", check_for_access_token, allowUser, async (req, res) => {
  try {
    const findByDoctor = req.body?.doctor ? true : false;
    const findByCity = req.body?.city ? true : false;
    const findByDistrict = req.body?.district ? true : false;
    const findByOrg = req.body?.org ? true : false;
    let appointments = [];
    let filteredAppointments = [];

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    if (findByDoctor) {
      appointments = await AppointmentModel.find({
        doctor: req.body.doctor,
        booked: false,
      }).populate(orgContrains);
    }

    if (findByCity || findByDistrict) {
      appointments = await AppointmentModel.find({ booked: false }).populate(
        orgContrains
      );

      if (findByCity) {
        appointments = appointments.filter(
          (item) => item.org.address.city === req.body.city
        );
      }

      if (findByDistrict) {
        appointments = appointments.filter(
          (item) => item.org.address.district === req.body.district
        );
      }
    }

    if (findByOrg) {
      appointments = await AppointmentModel.find({
        org: req.body.org,
        booked: false,
      }).populate(orgContrains);
    }

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
    const orgContrains = [
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
    }).populate(orgContrains);

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

    if (is_batch_code_exists) {
      const ret = await AppointmentModel.findOneAndUpdate(
        {
          batch_code: req.body.batch_code,
          booked: false,
        },
        {
          booked: true,
          patient: req.user.id,
          booking_time: Date.now(),
        }
      );

      if (!ret) {
        throw new ERROR("Slots of appointment is full.", 400, {
          free_slot: false,
        });
      }
    } else {
      throw new NOTFOUND("batch_code");
    }

    return res.status(200).json({
      message: "Successful operation",
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post("/cancel", check_for_access_token, allowUser, async (req, res) => {
  try {
    const is_batch_code_exists = req.body?.batch_code ? true : false;

    if (is_batch_code_exists) {
      const appointment = await AppointmentModel.findOne({
        batch_code: req.body.batch_code,
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

      await AppointmentModel.findOneAndUpdate(
        {
          batch_code: req.body.batch_code,
          patient: req.user.id,
        },
        {
          booked: true,
          patient: null,
          booking_time: null,
        }
      );
    } else {
      throw new NOTFOUND("batch_code");
    }

    return res.status(200).json({
      message: "Successful operation",
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
