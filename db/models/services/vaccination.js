const { Schema, SchemaTypes, model } = require("mongoose");
const { VACCINE_COLLECTION, USER_COLLECTION, ORG_COLLECTION } = process.env;

const vaccineSchema = Schema({
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  age_restriction: {
    min_age: { type: SchemaTypes.Number, default: 40, required: true },
    max_age: { type: SchemaTypes.Number, default: 45, required: true },
  },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  done: { type: SchemaTypes.Boolean, default: false },
  booked: { type: SchemaTypes.Boolean, default: false },
  patient: { type: SchemaTypes.ObjectId, ref: USER_COLLECTION },
  info: { type: SchemaTypes.String, required: false },
  batch_code: { type: SchemaTypes.String, required: true },
  booking_date: { type: SchemaTypes.Date, required: false },
  vaccine_name: { type: SchemaTypes.String, required: true },
  vaccine_doze: { type: SchemaTypes.String, default: "1ST", required: true },
  vaccine_date: { type: SchemaTypes.Date },
  self_booking: { type: SchemaTypes.Boolean, default: true, required: true },
  patient_details: {
    name: { type: SchemaTypes.String },
    age: { type: SchemaTypes.Number },
    mobile_no: { type: SchemaTypes.Number },
  },
});

module.exports = model(VACCINE_COLLECTION, vaccineSchema);
