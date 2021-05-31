const { Schema, SchemaTypes, model } = require("mongoose");
const { APPOINTMENT_COLLECTION, USER_COLLECTION, ORG_COLLECTION } = process.env;

const appointmentSchema = Schema({
  doctor: { type: SchemaTypes.ObjectId, required: true, ref: USER_COLLECTION },
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  done: { type: SchemaTypes.Boolean, default: false },
  booked: { type: SchemaTypes.Boolean, default: false },
  patient: { type: SchemaTypes.ObjectId, ref: USER_COLLECTION },
  appointment_date: { type: SchemaTypes.Date, required: true },
  booking_time: { type: SchemaTypes.Date, required: false },
  info: { type: SchemaTypes.String, required: false },
  batch_code: { type: SchemaTypes.String, required: true },
});

module.exports = model(APPOINTMENT_COLLECTION, appointmentSchema);
