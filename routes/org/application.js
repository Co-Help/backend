const {
  allowUser,
  check_for_access_token,
  allowAdmin,
} = require("../../middlewares/auth");
const {
  _middleware_applyForOrg,
  _approveApplication,
} = require("../../utils/validationProps");

const ApplicationModel = require("../../db/models/application");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const { HandleError, NOTFOUND, EXISTS, ERROR } = require("../../utils/error");
const { pushNotification } = require("../../utils/notification");

const router = require("express").Router();

router.get("/", check_for_access_token, allowUser, async (req, res) => {
  try {
    const application = await ApplicationModel.findOne({ user: req.user.id });

    if (!application) {
      throw new NOTFOUND("Application");
    }

    return res
      .status(200)
      .json({ message: "Successful operation", application });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowUser, async (req, res) => {
  try {
    const ret = await ApplicationModel.findOne({ user: req.user.id });

    if (ret.status === "approved") {
      throw new ERROR("Approved Requests can't be removed.");
    }

    await ret.remove();

    if (!ret) {
      throw new NOTFOUND("Application");
    }

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.get(
  "/can_apply",
  check_for_access_token,
  allowUser,
  async (req, res) => {
    try {
      if (await ApplicationModel.exists({ user: req.user.id })) {
        throw new EXISTS("Previous application");
      }
      return res.status(200).json({ message: "You can apply for org" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/apply",
  check_for_access_token,
  allowUser,
  _middleware_applyForOrg,
  async (req, res) => {
    try {
      if (await ApplicationModel.exists({ user: req.user.id })) {
        throw new EXISTS("Previous application");
      }

      const {
        name,
        logo_url,
        helpline_no,
        pinCode,
        state,
        district,
        city,
        vaccination,
        blood_test,
        blood_provide,
        oxygen_provide,
        bed_provide,
        doctor_appointment,
        emergency_provide,
        info,
      } = req.body;

      const application = new ApplicationModel({
        name,
        logo_url,
        helpline_no,
        user: req.user.id,
        address: {
          pinCode,
          state,
          district,
          city,
        },
        services: {
          vaccination,
          blood_test,
          blood_provide,
          oxygen_provide,
          bed_provide,
          doctor_appointment,
          emergency_provide,
        },
        info,
      });
      await application.save();

      return res.status(200).json({ message: "Successful Operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

// Admin Routes
router.get(
  "/requests",
  check_for_access_token,
  allowAdmin,
  async (req, res) => {
    try {
      const requests = await ApplicationModel.find().populate({
        path: "user",
        select: ["id", "name"],
      });

      return res
        .status(200)
        .json({ message: "Successfully fetched org requests.", requests });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/approve",
  check_for_access_token,
  allowAdmin,
  _approveApplication,
  async (req, res) => {
    try {
      const { id } = req.body;

      const user = await UserModel.findById(id);
      if (!user) {
        throw new NOTFOUND("User");
      }

      const application = await ApplicationModel.findOne({ user: id });
      if (!application) {
        throw new NOTFOUND("Application");
      }

      if (application.status === "approved") {
        throw new ERROR("Request is already approved");
      }

      if (await OrgModel.exists({ user: id })) {
        application.status = "rejected";
        await application.save();
        await pushNotification(
          "CoHelp Application Verification Team",
          "Unfortunately your application is being rejected because your account is already org mode.\
          Please ReLogin your account to use ORG features.",
          id
        );
        throw new EXISTS("Application already");
      }

      const org = new OrgModel({
        name: application.name,
        logo_url: application.logo_url,
        info: application.info,
        helpline_no: application.helpline_no,
        user: id,
        pass_key: "dummy",
        address: {
          pinCode: application.address.pinCode,
          state: application.address.state,
          district: application.address.district,
          city: application.address.city,
        },
        services: {
          vaccination: application.services.vaccination,
          blood_test: application.services.blood_test,
          blood_provide: application.services.blood_provide,
          oxygen_provide: application.services.oxygen_provide,
          bed_provide: application.services.bed_provide,
          doctor_appointment: application.services.doctor_appointment,
          emergency_provide: application.services.emergency_provide,
        },
      });
      await org.save();
      application.status = "approved";
      await application.save();
      user.role = "org";
      await user.save();
      await pushNotification(
        "CoHelp Application Verification Team",
        "Your application for transfer your account from user to org\
        is successfully approved. Please ReLogin your account to use ORG features.",
        id
      );
      return res.status(200).json({ message: "Successful Operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

module.exports = router;
