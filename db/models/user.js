const { Schema, SchemaTypes, model } = require("mongoose");
const { USER_COLLECTION } = process.env;

const userSchema = Schema({
  name: {
    type: SchemaTypes.String,
    required: true,
  },
  avatar: {
    type: SchemaTypes.String,
    required: true,
  },
  email: {
    type: SchemaTypes.String,
    required: true,
    unique: true,
  },
  age: {
    type: SchemaTypes.Number,
    default: null,
  },
  role: {
    type: SchemaTypes.String,
    default: "user",
  },
});

module.exports = model(USER_COLLECTION, userSchema);
