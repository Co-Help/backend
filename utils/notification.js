const NotificationModel = require("../db/models/notification");

const getNotification = async (id) => {
  try {
    return await NotificationModel.find({ user: id });
  } catch (err) {
    return null;
  }
};

const pushNotification = async (title, info, user) => {
  try {
    const notification = new NotificationModel({
      title,
      info,
      user,
    });
    await notification.save();
    return true;
  } catch (err) {
    return false;
  }
};

const interactNotification = async (id, read) => {
  try {
    await NotificationModel.findByIdAndUpdate(id, { read });
    return true;
  } catch (err) {
    return false;
  }
};

const deleteNotification = async (id) => {
  try {
    await NotificationModel.findByIdAndDelete(id);
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {
  getNotification,
  pushNotification,
  deleteNotification,
  interactNotification,
};
