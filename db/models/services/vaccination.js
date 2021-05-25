const { Schema, SchemaTypes, model } = require("mongoose");
const { VACCINE_COLLECTION, USER_COLLECTION, ORG_COLLECTION } = process.env;

const vaccineSchema = Schema({
  cost: { type: SchemaTypes.Number, default: 0, required: true },
  age_restriction: {
    min_age: { type: SchemaTypes.Number, default: 40, required: true },
    max_age: { type: SchemaTypes.Number, default: 45, required: true },
  },
  org: { type: SchemaTypes.ObjectId, ref: ORG_COLLECTION, required: true },
  done: { type: SchemaTypes.Boolean, default: false },
  booked: { type: SchemaTypes.Boolean, default: false },
  buyer: { type: SchemaTypes.ObjectId, ref: USER_COLLECTION },
  info: { type: SchemaTypes.String, required: false },
  schedules: {
    first_doze: {
      name: {
        type: SchemaTypes.String,
        required: true,
      },
      date: {
        type: SchemaTypes.Date,
        required: true,
      },
    },
    second_doze: {
      name: {
        type: SchemaTypes.String,
        required: true,
      },
      date: {
        type: SchemaTypes.Date,
      },
    },
  },
});

module.exports = model(VACCINE_COLLECTION, vaccineSchema);
