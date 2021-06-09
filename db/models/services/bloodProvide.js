const { Schema, SchemaTypes, model, SchemaType } = require("mongoose");
const { BLOOD_PROVIDE_COLLECTION, USER_COLLECTION, ORG_COLLECTION } =
  process.env;

const bloodProvideSchema = new Schema({
  group: { type: SchemaTypes.String, required: true },
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  available: { type: SchemaTypes.Boolean, default: false },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  info: { type: SchemaTypes.String, required: false },
});

module.exports = model(BLOOD_PROVIDE_COLLECTION, bloodProvideSchema);
