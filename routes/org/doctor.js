const router = require("express").Router();
const { NOTFOUND, ERROR, HandleError, INVALID } = require("../../utils/error");
const {
  check_for_access_token,
  allowOrg,
  allowUser,
  allowDoctor,
} = require("../../middlewares/auth");
const {
  _sendInvitation,
  _joinOrg,
  _createAppointment,
  _removeAppointment,
} = require("../../utils/validationProps");
const { sendMail } = require("../../utils/email");
const { pushNotification } = require("../../utils/notification");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const AppointmentModel = require("../../db/models/services/appointment");

router.post(
  "/invitation",
  check_for_access_token,
  allowOrg,
  _sendInvitation,
  async (req, res) => {
    try {
      const user = await UserModel.findById(req.body.id);
      if (!user) throw new NOTFOUND("User");

      if (user.role !== "user") {
        throw new ERROR("Current User already have different role");
      }

      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new INVALID("Org");

      await sendMail(
        user.email,
        `Invitation to the ${org.name}`,
        `You are invited as Doctor in ${org.name} Oranganisation. Copy the invitation code and join into the org from doctor panel.\n\nInvitation code - ${org.pass_key}`
      );
      await pushNotification(
        `${org.name} - Invitation`,
        `You are invited as Doctor in ${org.name} Oranganisation. Check your email for more info.`,
        user.id
      );
      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/join",
  check_for_access_token,
  allowUser,
  _joinOrg,
  async (req, res) => {
    try {
      const org = await OrgModel.findOne({ pass_key: req.body.pass_key });
      if (!org) {
        throw new NOTFOUND("Org");
      }

      if (!org.doctors.includes(req.user.id)) {
        org.doctors.push(req.user.id);
      }

      await UserModel.findByIdAndUpdate(req.user.id, {
        role: "doctor",
        doctor_info: { org: org.id },
      });
      await org.save();
      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post("/leave", check_for_access_token, allowDoctor, async (req, res) => {
  try {
    const doctor = await UserModel.findById(req.user.id);
    if (!doctor) throw new NOTFOUND("Doctor");

    const pendingWork = await AppointmentModel.find({
      doctor: req.user.id,
      done: false,
    });

    if (pendingWork.length > 1) {
      throw new ERROR(
        "You can't leave without finishing previous appointments.",
        400,
        {
          active_appointment: pendingWork.length,
        }
      );
    }

    const org = await OrgModel.findOne({
      doctors: {
        $elemMatch: { $eq: req.user.id },
      },
    });
    if (!org) throw new NOTFOUND("Org");

    doctor.role = "user";
    doctor.doctor_info.org = null;

    await doctor.save();
    await org.updateOne({
      $pull: {
        doctors: req.user.id,
      },
    });

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/enable",
  check_for_access_token,
  allowDoctor,
  async (req, res) => {
    try {
      const doctor = await UserModel.findById(req.user.id);
      if (!doctor) throw new NOTFOUND("User");

      doctor.doctor_info.active = true;
      await doctor.save();

      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/disable",
  check_for_access_token,
  allowDoctor,
  async (req, res) => {
    try {
      const doctor = await UserModel.findById(req.user.id);
      if (!doctor) throw new NOTFOUND("User");

      doctor.doctor_info.active = false;
      await doctor.save();

      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.get(
  "/appointment",
  check_for_access_token,
  allowDoctor,
  async (req, res) => {
    try {
      let appointments = [];

      const populateContrains = [
        {
          path: "patient",
          select: ["name", "avatar", "email", "dob", "contact"],
        },
      ];

      appointments = await AppointmentModel.find({
        doctor: req.user.id,
      }).populate(populateContrains);

      return res.status(200).json({
        message: "Successful operation",
        appointments: appointments,
      });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/appointment/set/done",
  check_for_access_token,
  allowDoctor,
  async (req, res) => {
    try {
      const doctor = await UserModel.findById(req.user.id);
      if (!doctor) throw new NOTFOUND("User");

      const id_given = req.body?.id ? true : false;
      const done = req.body.done !== undefined ? req.body.done : true;
      if (!id_given) throw new NOTFOUND("Appointment id");

      const ret = await AppointmentModel.findByIdAndUpdate(req.body.id, {
        done,
      });
      if (!ret) throw new NOTFOUND("Appointment");

      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/appointment/create",
  check_for_access_token,
  allowDoctor,
  _createAppointment,
  async (req, res) => {
    try {
      const doctor = await UserModel.findById(req.user.id);
      if (!doctor) throw new NOTFOUND("User");

      const { cost, appointment_date, booking_time, info, quantity } = req.body;

      if (quantity > 200) {
        throw new INVALID("Number of quantity");
      }
      const batch_code = require("uuid").v4().slice(0, 5);
      const org = doctor.doctor_info.org;

      for (let i = 0; i < quantity; i++) {
        const appointment = new AppointmentModel({
          cost,
          doctor,
          org,
          appointment_date,
          booking_time,
          info,
          batch_code,
        });
        await appointment.save();
      }

      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/appointment/remove",
  check_for_access_token,
  allowDoctor,
  _removeAppointment,
  async (req, res) => {
    try {
      const doctor = await UserModel.findById(req.user.id);
      if (!doctor) throw new NOTFOUND("User");

      const { empty_slots, batch_code } = req.body;

      const filter = empty_slots
        ? { batch_code }
        : { batch_code, booked: true };

      const ret = await AppointmentModel.deleteMany(filter);

      return res
        .status(200)
        .json({ message: "Successful operation", removed: ret });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

module.exports = router;
