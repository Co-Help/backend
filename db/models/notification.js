const { Schema, SchemaTypes, model } = require("mongoose");
const { NOTIFICATION_COLLECTION } = process.env;

const notificationSchema = Schema({
  title: { type: SchemaTypes.String, default: "CoHelp" },
  info: { type: SchemaTypes.String, required: true },
  time: { type: SchemaTypes.Date, default: Date.now() },
  user: { type: SchemaTypes.ObjectId, required: true },
  read: { type: SchemaTypes.Boolean, default: false },
});

module.exports = model(NOTIFICATION_COLLECTION, notificationSchema);
