const { Schema, SchemaTypes, model } = require("mongoose");
const { OXYGEN_COLLECTION, USER_COLLECTION, ORG_COLLECTION } = process.env;

const oxygenSchema = Schema({
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  capacity: { type: SchemaTypes.Number, default: 10, required: true },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  done: { type: SchemaTypes.Boolean, default: false },
  booked: { type: SchemaTypes.Boolean, default: false },
  buyer: { type: SchemaTypes.ObjectId, ref: USER_COLLECTION },
  booking_date: { type: SchemaTypes.Date, required: false },
  info: { type: SchemaTypes.String, required: false },
  batch_code: { type: SchemaTypes.String, required: true },
  self_booking: { type: SchemaTypes.Boolean, default: true, required: true },
  patient_details: {
    name: { type: SchemaTypes.String },
    age: { type: SchemaTypes.Number },
    mobile_no: { type: SchemaTypes.Number },
    aadhar: { type: SchemaTypes.String },
  },
});

module.exports = model(OXYGEN_COLLECTION, oxygenSchema);
