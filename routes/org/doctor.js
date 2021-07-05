const router = require("express").Router();
const { NOTFOUND, ERROR, HandleError, INVALID } = require("../../utils/error");
const {
  check_for_access_token,
  allowOrg,
  allowUser,
  allowDoctor,
  allowAll,
} = require("../../middlewares/auth");
const { _sendInvitation, _joinOrg } = require("../../utils/validationProps");
const { sendMail } = require("../../utils/email");
const { pushNotification } = require("../../utils/notification");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const AppointmentModel = require("../../db/models/services/appointment");
const { GET_HTML, bold } = require("../../utils/template");

router.get("/", async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const findByOrg = req.query?.org ? true : false;
    const findByPin = req.query?.pin ? true : false;
    const keywordsGiven = req.query?.search ? true : false;

    const orgContrains = {
      path: "doctor_info.org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    const orgFilter = findByOrg ? { "doctor_info.org": req.query.org } : {};

    const doctorFilter = [
      "-dob",
      "-is_profile_completed",
      "-contact.mobile_no",
      "-aadhar",
      "-address",
    ];

    const searchConstrains = keywordsGiven
      ? { name: { $regex: req.query.search, $options: "i" } }
      : {};

    users = await UserModel.find({
      role: "doctor",
      "doctor_info.active": true,
      ...searchConstrains,
      ...orgFilter,
    })
      .select(doctorFilter)
      .populate(orgContrains);

    users = users.filter((item) => {
      if (
        findByPin &&
        item.doctor_info.org.address.pinCode !== Number(req.query.pin)
      ) {
        return false;
      }

      if (
        findByCity &&
        item.doctor_info.org.address.city.toLowerCase() !==
          req.query.city.toLowerCase()
      ) {
        return false;
      }

      if (
        findByDistrict &&
        item.doctor_info.org.address.district.toLowerCase() !==
          req.query.district.toLowerCase()
      ) {
        return false;
      }

      return true;
    });

    return res.status(200).json({
      message: "Successful operation",
      users: users,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/invitation",
  check_for_access_token,
  allowOrg,
  _sendInvitation,
  async (req, res) => {
    try {
      const user = await UserModel.findOne({ email: req.body.email });
      if (!user) throw new NOTFOUND("User");

      if (user.role !== "user") {
        throw new ERROR("Current User already have different role");
      }

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new INVALID("Org");

      if (!org.services.doctor_appointment) {
        throw new ERROR(
          "Your org doesn't have permission to use Doctor appointment Service",
          400,
          { permission_denied: true }
        );
      }

      await sendMail(
        user.email,
        `${org.name} Team`,
        "",
        GET_HTML(
          "Doctor Invitation",
          false,
          `You are invited as Doctor in ${bold(
            org.name
          )}.\nCopy the invitation code and join into the org from doctor panel.\n
        Invitation code : ${bold(org.pass_key)}\n
        ${bold("Note : ")}Do not share this key to anyone.`
        )
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

router.post(
  "/profile/setup",
  check_for_access_token,
  allowDoctor,
  async (req, res) => {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) throw new NOTFOUND("User");

      const qProvided = Array.isArray(req.body.qualifications) ? true : false;
      const sProvided = Array.isArray(req.body.specialties) ? true : false;

      user.doctor_info.qualifications = qProvided
        ? req.body.qualifications
        : user.doctor_info.qualifications;
      user.doctor_info.specialties = sProvided
        ? req.body.specialties
        : user.doctor_info.specialties;

      await user.save();

      return res.status(200).json({ message: "Successful Operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

module.exports = router;
