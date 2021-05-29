const router = require("express").Router();
const { HandleError } = require("../../utils/error");

const { _interactNotification } = require("../../utils/validationProps");
const { check_for_access_token, allowAll } = require("../../middlewares/auth");

const {
  getNotification,
  pushNotification,
  interactNotification,
} = require("../../utils/notification");

router.get("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const notifications = await getNotification(req.user.id);

    if (notifications === null) {
      throw new Error("Error while fetching notification");
    }

    return res.status(200).json({
      message: "Successful operation",
      notifications,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.put(
  "/",
  check_for_access_token,
  allowAll,
  _interactNotification,
  async (req, res) => {
    try {
      const ret = await interactNotification(
        req.body.id,
        req.body?.read ?? false
      );
      if (!ret) {
        throw new Error("Error while changing notification status");
      }

      return res.status(200).json({
        message: "Successful operation",
      });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

module.exports = router;
