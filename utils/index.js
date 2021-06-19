const { NOTFOUND } = require("./error");

const getBookingConstrains = (body) => {
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

  return !self_booking
    ? {
        patient_details: {
          name: body.name,
          age: body.age,
          mobile_no: body.mobile_no,
        },
        self_booking: false,
      }
    : { self_booking: true };
};

module.exports = { getBookingConstrains };
