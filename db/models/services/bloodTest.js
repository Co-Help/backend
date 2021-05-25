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
});

module.exports = model(BLOOD_TEST_COLLECTION, bloodTestSchema);
