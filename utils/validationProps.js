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

const _applyForOrg = [
  string_prop("name"),
  number_prop("helpline_no"),
  number_prop("pinCode"),
  string_prop("state"),
  string_prop("district"),
  string_prop("city"),
  boolean_prop("vaccination"),
  boolean_prop("blood_test"),
  boolean_prop("blood_provide"),
  boolean_prop("oxygen_provide"),
  boolean_prop("bed_provide"),
  boolean_prop("doctor_appointment"),
  boolean_prop("emergency_provide"),
  string_prop("info"),
];

const _middleware_applyForOrg = (req, res, next) => {
  if (valid_data(req.body, _applyForOrg)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

const interactNotification = [string_prop("id"), boolean_prop("read")];

const _interactNotification = (req, res, next) => {
  if (valid_data(req.body, interactNotification)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

const approveApplication = [string_prop("id")];

const _approveApplication = (req, res, next) => {
  if (valid_data(req.body, approveApplication)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

const sendInvitation = [string_prop("id")];

const _sendInvitation = (req, res, next) => {
  if (valid_data(req.body, sendInvitation)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

const joinOrg = [string_prop("pass_key")];

const _joinOrg = (req, res, next) => {
  if (valid_data(req.body, joinOrg)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

const createAppointment = [
  number_prop("cost"),
  string_prop("appointment_date"),
  string_prop("booking_time"),
  string_prop("info"),
  number_prop("quantity"),
];

const _createAppointment = (req, res, next) => {
  if (valid_data(req.body, createAppointment)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

const removeAppointment = [
  boolean_prop("empty_slots"),
  string_prop("batch_code"),
];

const _removeAppointment = (req, res, next) => {
  if (valid_data(req.body, removeAppointment)) {
    next();
  } else {
    res.status(400).json({ msg: "Invalid Data" });
  }
};

module.exports = {
  _completeUserProfileProps,
  _middleware_setupUserProfile,
  _middleware_applyForOrg,
  _interactNotification,
  _approveApplication,
  _sendInvitation,
  _joinOrg,
  _createAppointment,
  _removeAppointment,
};
