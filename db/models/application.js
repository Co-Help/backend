const { Schema, SchemaTypes, model } = require("mongoose");
const { APPLICATION_COLLECTION, USER_COLLECTION } = process.env;

const applicationSchema = Schema({
  name: { type: SchemaTypes.String, required: true },
  logo_url: SchemaTypes.String,
  helpline_no: SchemaTypes.Number,
  user: { type: SchemaTypes.ObjectId, ref: USER_COLLECTION },
  status: { type: SchemaTypes.String, default: "pending" },
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
  info: { type: SchemaTypes.String, required: false },
});

module.exports = model(APPLICATION_COLLECTION, applicationSchema);
