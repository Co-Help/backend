const { Schema, SchemaTypes, model, SchemaType } = require("mongoose");
const { CONFIG_COLLECTION, ORG_COLLECTION } = process.env;

const configSchema = Schema({
  service: { type: SchemaTypes.String, required: true },
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  date: { type: SchemaTypes.Date, default: Date.now() },
  batch_code: { type: SchemaTypes.String, required: true },
  info: { type: SchemaTypes.String, default: "" },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },

  // Only for oxygen provide
  capacity: { type: SchemaTypes.Number, default: 0, required: false },
  // Only For Vaccination
  min_age: { type: SchemaTypes.Number, required: false },
  max_age: { type: SchemaTypes.Number, required: false },
  vaccine_name: { type: SchemaTypes.String, required: false },
});

module.exports = model(CONFIG_COLLECTION, configSchema);
