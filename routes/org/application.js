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

const { OAuth2Client } = require("google-auth-library");
const { CLIENT_ID } = process.env;
const { v4 } = require("uuid");

const client = new OAuth2Client(CLIENT_ID);

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

router.get("/can_apply", async (req, res) => {
  try {
    const email_provided = req.query.email != undefined ? true : false;
    if (!email_provided) throw new NOTFOUND("Email");

    const email = req.query.email.toLowerCase();

    if (await UserModel.exists({ email })) {
      throw new ERROR(
        "User account already exists. Delete account then apply."
      );
    }

    if (
      await OrgModel.exists({
        $or: [{ admin: email }, { members: { $in: [email] } }],
      })
    ) {
      throw new ERROR("You are already under an organization.");
    }

    if (await ApplicationModel.exists({ "admin.email": email })) {
      throw new EXISTS("Previous application");
    }
    return res.status(200).json({ message: "You can apply for org" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post("/apply", _middleware_applyForOrg, async (req, res) => {
  try {
    const ret = await client.verifyIdToken({
      idToken: req.body.idToken,
      audience: CLIENT_ID,
    });

    const { email_verified, email, picture } = ret.payload;
    if (!email_verified) throw Error("Email is Not Varified");

    if (await ApplicationModel.exists({ "admin.email": email })) {
      throw new EXISTS("Previous application");
    }

    if (await UserModel.exists({ email })) {
      throw new ERROR("User already exists. Delete the User Account first.", {
        user_acc: true,
      });
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
      user: null,
      admin: {
        name: ret.payload.name,
        email,
        avatar: picture,
      },
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
});

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

      const application = await ApplicationModel.findById(id);
      if (!application) throw new NOTFOUND("Application");

      const org = await OrgModel.findOne({
        $or: [
          { admin: application.admin.email },
          { members: { $in: [application.admin.email] } },
        ],
      });
      if (org) {
        throw new ERROR("User is already a org admin or Member");
      }

      const user = await UserModel.findOne({ email: application.admin.email });
      if (user) {
        throw new EXISTS("User");
      }

      if (application.status === "approved") {
        throw new ERROR("Request is already approved");
      }

      const newUser = await new UserModel({
        name: application.admin.name,
        email: application.admin.email,
        avatar: application.admin.avatar,
        role: "org",
      }).save();

      const newOrg = new OrgModel({
        name: application.name,
        logo_url: application.logo_url,
        info: application.info,
        helpline_no: application.helpline_no,
        user: newUser._id,
        admin: newUser.email,
        pass_key: v4(),
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
      await newOrg.save();
      application.status = "approved";
      await application.save();
      await pushNotification(
        "CoHelp Application Verification Team",
        "Your application for transfer your account from user to org\
        is successfully approved.",
        newUser._id
      );
      return res.status(200).json({ message: "Successful Operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

module.exports = router;
