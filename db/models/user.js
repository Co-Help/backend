const { Schema, SchemaTypes, model } = require("mongoose");
const { USER_COLLECTION, ORG_COLLECTION } = process.env;

const userSchema = Schema({
  name: { type: SchemaTypes.String, required: true },
  avatar: { type: SchemaTypes.String, required: true },
  email: { type: SchemaTypes.String, required: true, unique: true },
  dob: { type: SchemaTypes.Number, default: null },
  role: { type: SchemaTypes.String, default: "user" },
  is_profile_completed: { type: SchemaTypes.Boolean, default: false },
  address: {
    pinCode: { type: SchemaTypes.Number },
    state: { type: SchemaTypes.String },
    district: { type: SchemaTypes.String },
    city: { type: SchemaTypes.String },
  },
  contact: {
    mobile_no: { type: SchemaTypes.Number },
    alt_no: { type: SchemaTypes.Number },
  },
  doctor_info: {
    role: { type: SchemaTypes.String },
    is_profile_completed: { type: SchemaTypes.Boolean, default: false },
    active: { type: SchemaTypes.Boolean, default: false },
    org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION },
    available: {
      morning: {
        from: SchemaTypes.Number,
        to: SchemaTypes.Number,
      },
      afternoon: {
        from: SchemaTypes.Number,
        to: SchemaTypes.Number,
      },
      night: {
        from: SchemaTypes.Number,
        to: SchemaTypes.Number,
      },
    },
  },
});

module.exports = model(USER_COLLECTION, userSchema);
