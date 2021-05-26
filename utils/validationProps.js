const {
  string_prop,
  boolean_prop,
  object_prop,
  valid_data,
  number_prop,
} = require("./validateData");

const _completeUserProfileProps = [
  number_prop("dob"),
  number_prop("pinCode"),
  string_prop("state"),
  string_prop("district"),
  string_prop("city"),
  number_prop("mobile_no"),
];

const _middleware_setupUserProfile = (req, res, next) => {
  if (valid_data(req.body, _completeUserProfileProps)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

module.exports = {
  _completeUserProfileProps,
  _middleware_setupUserProfile,
};
