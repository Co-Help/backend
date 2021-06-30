const { NOTFOUND } = require("./error");

const getBookingConstrains = (body, user) => {
  const self_booking =
    body.self_booking != undefined ? body.self_booking : true;

  if (!self_booking) {
    if (!body.name || typeof body.name != "string") {
      throw new NOTFOUND("Patient Name (name)");
    }

    if (!body.age || typeof body.age != "number") {
      throw new NOTFOUND("Patient Age (age)");
    }

    if (!body.mobile_no || typeof body.mobile_no != "number") {
      throw new NOTFOUND("Patient Age (mobile_no)");
    }
  }

  let age = 0;
  if (self_booking) {
    const now = new Date().getFullYear();
    const dob = new Date(user.dob).getFullYear();
    age = now - dob;
  } else {
    age = body.age;
  }

  return {
    patient_details: {
      name: self_booking ? user.name : body.name,
      age,
      mobile_no: self_booking ? user.contact.mobile_no : body.mobile_no,
    },
    self_booking,
  };
};

module.exports = { getBookingConstrains };
