const { Schema, SchemaTypes, model } = require("mongoose");
const { BLOOD_PROVIDE_COLLECTION, USER_COLLECTION, ORG_COLLECTION } =
  process.env;

const bloodProvideSchema = new Schema({
  group: { type: SchemaTypes.String, required: true },
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  done: { type: SchemaTypes.Boolean, default: false },
  booked: { type: SchemaTypes.Boolean, default: false },
  buyer: { type: SchemaTypes.ObjectId, ref: USER_COLLECTION },
  booking_time: { type: SchemaTypes.Date, required: false },
  info: { type: SchemaTypes.String, required: false },
});

module.exports = model(BLOOD_PROVIDE_COLLECTION, bloodProvideSchema);
