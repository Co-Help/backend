const { Schema, SchemaTypes, model } = require("mongoose");
const { BLOOD_TEST_COLLECTION, USER_COLLECTION, ORG_COLLECTION } = process.env;

const bloodTestSchema = new Schema({
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  done: { type: SchemaTypes.Boolean, default: false },
  booked: { type: SchemaTypes.Boolean, default: false },
  patient: { type: SchemaTypes.ObjectId, ref: USER_COLLECTION },
  test_date: { type: SchemaTypes.Date, required: true },
  booking_date: { type: SchemaTypes.Date, required: false },
  info: { type: SchemaTypes.String, required: false },
  batch_code: { type: SchemaTypes.String, required: true },
  self_booking: { type: SchemaTypes.Boolean, default: true, required: true },
  patient_details: {
    name: { type: SchemaTypes.String },
    age: { type: SchemaTypes.Number },
    mobile_no: { type: SchemaTypes.Number },
  },
});

module.exports = model(BLOOD_TEST_COLLECTION, bloodTestSchema);
