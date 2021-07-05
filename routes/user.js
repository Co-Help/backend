const router = require("express").Router();
const { HandleError, INVALID, NOTFOUND, ERROR } = require("../utils/error");
const { _middleware_setupUserProfile } = require("../utils/validationProps");
const utils = require("../utils/index");

const UserModel = require("../db/models/user");
const OrgModel = require("../db/models/org");

const AppointmentModel = require("../db/models/services/appointment");
const BloodTestModel = require("../db/models/services/bloodTest");
const OxygenModel = require("../db/models/services/oxygenProvide");
const VaccinationModel = require("../db/models/services/vaccination");

const { check_for_access_token, allowUser } = require("../middlewares/auth");
const { sendMail } = require("../utils/email");
const { GET_HTML, bold } = require("../utils/template");

router.post(
  "/profile/setup",
  check_for_access_token,
  _middleware_setupUserProfile,
  async (req, res) => {
    try {
      const { dob, pinCode, state, district, city, mobile_no, alt_no, aadhar } =
        req.body;

      if (!utils.aadhar.test(aadhar)) throw new INVALID("Aadhar");

      // Get the user
      let user = await UserModel.findById(req.user.id);
      if (!user) throw NOTFOUND(`User ${req.user.name}`);

      user.dob = dob;
      user.is_profile_completed = true;
      user.aadhar = aadhar;
      user.address = {
        pinCode,
        state,
        district,
        city,
      };
      user.contact = {
        mobile_no,
        alt_no: alt_no,
      };
      await user.save();

      return res.status(200).json({
        message: "Successful operation",
      });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.get("/profile", check_for_access_token, async (req, res) => {
  try {
    let org = {};
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    if (user.role === "org") {
      org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      }).populate("doctors");
    }

    return res.status(200).json({
      message: "Successful Operation",
      profile: user,
      org,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowUser, async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.user.id, role: "user" });
    if (!user) throw new NOTFOUND("User");

    const p_appointments = await AppointmentModel.exists({
      patient: user,
      done: false,
    });

    if (p_appointments) {
      throw new ERROR(
        "Booked Appointments are not completed. To remove your account, you have to either cancel the appointment or complete the appointment."
      );
    }

    const p_blood_test = await BloodTestModel.exists({
      patient: user,
      done: false,
    });

    if (p_blood_test) {
      throw new ERROR(
        "Blood tests are not completed. To remove your account, you have to either cancel the booking or complete the service."
      );
    }

    const p_oxygen = await OxygenModel.exists({
      buyer: user,
      done: false,
    });

    if (p_oxygen) {
      throw new ERROR(
        "Oxygen booking still in progress. To remove your account, you have to either cancel the booking or complete the service."
      );
    }

    const p_vaccination = await VaccinationModel.exists({
      patient: user,
      done: false,
    });

    if (p_vaccination) {
      throw new ERROR(
        "You already booked for vaccination and it still not completed. To remove your account, you have to either cancel the booking or complete the service."
      );
    }

    await AppointmentModel.updateMany(
      { patient: user, done: true },
      { patient: null }
    );

    await BloodTestModel.updateMany(
      { patient: user, done: true },
      { patient: null }
    );

    await OxygenModel.updateMany({ buyer: user, done: true }, { buyer: null });

    await VaccinationModel.updateMany(
      { patient: user, done: true },
      { patient: null }
    );

    await UserModel.findByIdAndDelete(req.user.id);

    await sendMail(
      req.user.email,
      "Account Deletion",
      "",
      GET_HTML(
        "Successfully Removed Your Account",
        false,
        `Your account has been ${bold(
          "successfully deleted"
        )}.\nThank you for using Our Services.`
      )
    );

    return res.status(200).json({ message: "Successful Operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
