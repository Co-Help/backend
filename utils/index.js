const { NOTFOUND, INVALID } = require("./error");

const getBookingConstrains = (body, user, useAadhar = false) => {
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

    if (useAadhar) {
      if (!body.aadhar || typeof body.aadhar != "string") {
        throw new NOTFOUND("Aadhar No (aadhar)");
      } else if (!aadhar.test(body.aadhar)) {
        throw new INVALID("Aadhar");
      }
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
      aadhar: useAadhar ? (self_booking ? user.aadhar : body.aadhar) : null,
    },
    self_booking,
  };
};

const aadhar = /^[2-9]{1}[0-9]{3}\s{1}[0-9]{4}\s{1}[0-9]{4}$/;
const email = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

module.exports = { getBookingConstrains, aadhar, email };
