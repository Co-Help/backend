const router = require("express").Router();
const { HandleError, INVALID, NOTFOUND } = require("../utils/error");
const { _middleware_setupUserProfile } = require("../utils/validationProps");
const utils = require("../utils/index");

const UserModel = require("../db/models/user");
const OrgModel = require("../db/models/org");

const { check_for_access_token } = require("../middlewares/auth");

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

module.exports = router;
