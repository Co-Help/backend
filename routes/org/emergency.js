const router = require("express").Router();
const { check_for_access_token, allowOrg } = require("../../middlewares/auth");
const EmergencyModel = require("../../db/models/services/emergencyProvide");
const { NOTFOUND, HandleError } = require("../../utils/error");
const { _createEmergency } = require("../../utils/validationProps");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");

router.get("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const emergencies = await EmergencyModel.find({ org });

    return res.status(200).json({
      message: "Successful operation",
      services: emergencies,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/",
  check_for_access_token,
  allowOrg,
  _createEmergency,
  async (req, res) => {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new NOTFOUND("Org");

      if (!org.services.emergency_provide) {
        throw new ERROR(
          "Your org doesn't have permission to use Emergency Service",
          400,
          { permission_denied: true }
        );
      }

      const { emergency_no, cost, info, available } = req.body;

      const emergency = new EmergencyModel({
        emergency_no,
        cost,
        org,
        info,
        available,
      });

      await emergency.save();

      return res.status(200).json({
        message: "Successful operation",
      });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.put("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const is_given_id = req.body?.id ? true : false;
    if (!is_given_id) throw new NOTFOUND("id (emergency_id)");

    const emergency = await EmergencyModel.findOne({
      _id: req.body.id,
      org: org.id,
    });
    if (!emergency) throw new NOTFOUND("Emergency obj");

    emergency.emergency_no = req.body?.emergency_no ?? emergency.emergency_no;
    emergency.cost = req.body?.cost ?? emergency.cost;
    emergency.info = req.body?.info ?? emergency.info;
    emergency.available = req.body?.available ?? emergency.available;
    await emergency.save();

    return res.status(200).json({
      message: "Successful operation",
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const { id } = req.body;
    if (!id) throw new NOTFOUND("Emergency id");

    await EmergencyModel.findOneAndDelete({ _id: id, org });

    return res.status(200).json({
      message: "Successful operation",
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
