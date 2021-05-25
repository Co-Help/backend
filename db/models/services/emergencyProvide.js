const { Schema, SchemaTypes, model } = require("mongoose");
const { EMERGENCY_PROVIDE_COLLECTION, ORG_COLLECTION } = process.env;

const emergencyProvideSchema = Schema({
  emergency_no: { type: SchemaTypes.Number, default: 0, required: true },
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  info: { type: SchemaTypes.String, required: false },
  available: { type: SchemaTypes.Boolean, default: false },
});

module.exports = model(EMERGENCY_PROVIDE_COLLECTION, emergencyProvideSchema);
