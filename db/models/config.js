const { Schema, SchemaTypes, model } = require("mongoose");
const { CONFIG_COLLECTION, ORG_COLLECTION } = process.env;

const configSchema = Schema({
  service: { type: SchemaTypes.String, required: true },
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  capacity: { type: SchemaTypes.Number, default: 0, required: false },
  date: { type: SchemaTypes.Date, default: Date.now() },
  batch_code: { type: SchemaTypes.String, required: true },
  info: { type: SchemaTypes.String, required: true },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
});

module.exports = model(CONFIG_COLLECTION, configSchema);
