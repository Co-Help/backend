const { Schema, SchemaTypes, model } = require("mongoose");
const { BED_PROVIDE_COLLECTION, USER_COLLECTION, ORG_COLLECTION } = process.env;

const bedProvideSchema = Schema({
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  info: { type: SchemaTypes.String, required: false },
  total_beds: { type: SchemaTypes.Number, required: true },
  available_beds: { type: SchemaTypes.Number, required: true },
  available: { type: SchemaTypes.Boolean, default: false, required: true },
});

module.exports = model(BED_PROVIDE_COLLECTION, bedProvideSchema);
