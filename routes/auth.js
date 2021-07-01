const router = require("express").Router();
const { OAuth2Client } = require("google-auth-library");
const { CLIENT_ID, ANDROID_CLIENT_ID } = process.env;
const UserModel = require("../db/models/user");
const ApplicationModel = require("../db/models/application");
const OrgModel = require("../db/models/org");

const { getAccessToken, getRefreshToken } = require("../manager/jwt");
const TokenManager = require("../manager/tokenManager");
const {
  check_for_access_token,
  check_for_refresh_token,
  check_for_login_token,
} = require("../middlewares/auth");
const { ERROR } = require("../utils/error");

const client = new OAuth2Client(CLIENT_ID);
const android_client = new OAuth2Client(ANDROID_CLIENT_ID);
const tokenManager = new TokenManager();

router.post("/login", async (req, res) => {
  let resBLK = {
    access_token: null,
    refresh_token: null,
    user: null,
  };
  try {
    const android_login =
      req.body.android_login !== undefined ? req.body.android_login : false;

    const currClient = android_login ? android_client : client;
    const clientID = android_login ? ANDROID_CLIENT_ID : CLIENT_ID;

    const ret = await currClient.verifyIdToken({
      idToken: req.body.idToken,
      audience: clientID,
    });

    const { email_verified, email, name, picture } = ret.payload;
    if (!email_verified) throw Error("Email is Not Varified");

    // Checking if user applied for Application
    const applied_for_org = await ApplicationModel.exists({
      "admin.email": email,
    });
    const already_org = await OrgModel.findOne({
      $or: [{ admin: email }, { members: { $in: [email] } }],
    });

    if (applied_for_org && !already_org) {
      throw new ERROR("User applied for ORG.", { application: true });
    }

    const member_detected = already_org
      ? already_org.members.find((item) => {
          return item === email;
        })
      : false;

    const user = await UserModel.findOne({ email });

    let tokenUser;

    if (!user) {
      tokenUser = await new UserModel({
        name,
        email,
        avatar: picture,
        role: member_detected ? "org" : "user",
      }).save();
    } else {
      tokenUser = user;
    }

    resBLK.access_token = getAccessToken(tokenUser);
    resBLK.refresh_token = getRefreshToken(tokenUser);

    if (!tokenManager.isTokenAvailable(resBLK.refresh_token)) {
      tokenManager.addToken(resBLK.refresh_token);
    }

    // tokenManager.log();

    return res.status(200).json({
      ...resBLK,
      message: "Logged in",
      user: {
        id: tokenUser.id,
        name: tokenUser.name,
        email: tokenUser.email,
        dob: tokenUser.dob,
        role: tokenUser.role,
        avatar: tokenUser.avatar,
        is_profile_completed: tokenUser.is_profile_completed,
        address: tokenUser?.address ?? null,
        contact: tokenUser?.contact ?? null,
        doctor_info:
          tokenUser.role === "doctor" ? tokenUser?.doctor_info ?? null : null,
      },
    });
  } catch (err) {
    return res.status(400).json({
      ...resBLK,
      message: err?.message ?? err,
    });
  }
});

router.post("/login/mobile", check_for_login_token, async (req, res) => {
  let resBLK = {
    access_token: null,
    refresh_token: null,
    user: null,
  };
  try {
    const { email_verified, email, name, picture } = req.jaguar;

    if (!email_verified) throw Error("Email is Not Varified");

    const user = await UserModel.findOne({ email });

    let tokenUser;

    if (!user) {
      tokenUser = await new UserModel({
        name,
        email,
        avatar: picture,
      }).save();
    } else {
      tokenUser = user;
    }

    resBLK.access_token = getAccessToken(tokenUser);
    resBLK.refresh_token = getRefreshToken(tokenUser);

    if (!tokenManager.isTokenAvailable(resBLK.refresh_token)) {
      tokenManager.addToken(resBLK.refresh_token);
    }

    // tokenManager.log();

    return res.status(200).json({
      ...resBLK,
      message: "Logged in",
      user: {
        id: tokenUser.id,
        name: tokenUser.name,
        email: tokenUser.email,
        dob: tokenUser.dob,
        role: tokenUser.role,
        avatar: tokenUser.avatar,
        is_profile_completed: tokenUser.is_profile_completed,
        address: tokenUser?.address ?? null,
        contact: tokenUser?.contact ?? null,
        doctor_info:
          tokenUser.role === "doctor" ? tokenUser?.doctor_info ?? null : null,
      },
    });
  } catch (err) {
    return res.status(400).json({
      ...resBLK,
      message: err?.message ?? err,
    });
  }
});

router.post("/logout", check_for_refresh_token, async (req, res) => {
  const refresh_token = req.body?.refresh_token ?? null;

  if (!refresh_token) {
    return res.status(400).json({ message: "Refresh Token not provided" });
  }

  if (!tokenManager.isTokenAvailable(refresh_token)) {
    return res.status(200).json({ message: "User Already logged out" });
  }

  tokenManager.removeToken(refresh_token);
  // tokenManager.log();
  return res.status(200).json({ message: "User successfully logged out" });
});

router.post("/token", check_for_refresh_token, (req, res) => {
  if (!tokenManager.isTokenAvailable(req.body.refresh_token)) {
    return res.status(400).json({ message: "User already logged out." });
  }

  return res.status(200).json({
    message: "Successfully reloaded tokens",
    access_token: getAccessToken(req.user),
  });
});

router.get("/check", check_for_access_token, (req, res) => {
  return res.status(200).json({
    message: "Hello world",
    user: req.user,
  });
});

module.exports = router;
