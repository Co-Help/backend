const { Schema, SchemaTypes, model } = require("mongoose");
const { USER_COLLECTION, ORG_COLLECTION } = process.env;

const orgSchema = Schema({
  name: { type: SchemaTypes.String, required: true },
  logo_url: SchemaTypes.String,
  info: SchemaTypes.String,
  helpline_no: SchemaTypes.Number,
  pass_key: { type: SchemaTypes.String, required: true },
  address: {
    pinCode: { type: SchemaTypes.Number, required: true },
    state: { type: SchemaTypes.String, required: true },
    district: { type: SchemaTypes.String, required: true },
    city: { type: SchemaTypes.String, required: true },
  },
  services: {
    vaccination: { type: SchemaTypes.Boolean, default: false },
    blood_test: { type: SchemaTypes.Boolean, default: false },
    blood_provide: { type: SchemaTypes.Boolean, default: false },
    oxygen_provide: { type: SchemaTypes.Boolean, default: false },
    bed_provide: { type: SchemaTypes.Boolean, default: false },
    doctor_appointment: { type: SchemaTypes.Boolean, default: false },
    emergency_provide: { type: SchemaTypes.Boolean, default: false },
  },
  doctors: [{ type: SchemaTypes.ObjectId, ref: USER_COLLECTION }],
});

module.exports = model(ORG_COLLECTION, orgSchema);
