const router = require("express").Router();
const { check_for_access_token, allowOrg } = require("../../middlewares/auth");
const { NOTFOUND, HandleError, ERROR, EXISTS } = require("../../utils/error");
const { _createBloodProvide } = require("../../utils/validationProps");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const ServiceModel = require("../../db/models/services/bloodProvide");

router.get("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const services = await ServiceModel.find({ org });

    return res.status(200).json({
      message: "Successful operation",
      services: services,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/",
  check_for_access_token,
  allowOrg,
  _createBloodProvide,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new NOTFOUND("Org");

      if (!org.services.blood_provide) {
        throw new ERROR(
          "Your org doesn't have permission to use Blood Provide Service",
          400,
          { permission_denied: true }
        );
      }

      const { group, cost, info } = req.body;

      if (await ServiceModel.exists({ group })) {
        throw new EXISTS("Same blood group");
      }

      const service = new ServiceModel({
        group,
        cost,
        info,
        org,
      });
      await service.save();
      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post("/edit", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const { id, cost, group, available, info } = req.body;

    const service = await ServiceModel.findById(id);
    if (!service) throw new NOTFOUND("BloodProvide Obj");

    if ((await ServiceModel.exists({ group })) && service.group !== group) {
      throw new EXISTS("Same blood group");
    }

    service.cost = cost != undefined ? cost : service.cost;
    service.group = group ? group : service.group;
    service.available = available != undefined ? available : service.available;
    service.info = info ? info : service.info;
    await service.save();

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const id_given = req.body?.id ? true : false;
    if (!id_given) throw new NOTFOUND("id");

    const { id } = req.body;
    const ret = await ServiceModel.findOneAndDelete({ _id: id, org });
    if (!ret) throw new ERROR("Error while removing", 500, { err: ret });

    return res
      .status(200)
      .json({ message: "Successful operation", status: ret });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
