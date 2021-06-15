const router = require("express").Router();
const { HandleError, INVALID, NOTFOUND } = require("../utils/error");
const { _middleware_setupUserProfile } = require("../utils/validationProps");

const UserModel = require("../db/models/user");

const { check_for_access_token } = require("../middlewares/auth");

router.post(
  "/profile/setup",
  check_for_access_token,
  _middleware_setupUserProfile,
  async (req, res) => {
    try {
      const { dob, pinCode, state, district, city, mobile_no, alt_no } =
        req.body;

      // Get the user
      let user = await UserModel.findById(req.user.id);
      if (!user) throw NOTFOUND(`User ${req.user.name}`);

      user.dob = dob;
      user.is_profile_completed = true;
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
      console.log("Hue hue hue");
      return HandleError(err, res);
    }
  }
);

router.get("/profile", check_for_access_token, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    return res.status(200).json({
      message: "Successful Operation",
      profile: user,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
