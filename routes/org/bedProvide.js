const router = require("express").Router();
const { check_for_access_token, allowOrg } = require("../../middlewares/auth");
const { NOTFOUND, HandleError, ERROR } = require("../../utils/error");
const { _createBedProvide } = require("../../utils/validationProps");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const ServiceModel = require("../../db/models/services/bedProvide");

router.get("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.findOne({ user: req.user.id });
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
  _createBedProvide,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new NOTFOUND("Org");

      if (!org.services.bed_provide) {
        throw new ERROR(
          "Your org doesn't have permission to use Bed Provide Service",
          400,
          { permission_denied: true }
        );
      }

      const { cost, info, total_beds, available_beds, available } = req.body;

      if (total_beds < available_beds)
        throw new ERROR("Total no bed is lower than available bed");

      const service = new ServiceModel({
        cost,
        info,
        org,
        total_beds,
        available_beds,
        available,
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

    const org = await OrgModel.findOne({ user: req.user.id });
    if (!org) throw new NOTFOUND("Org");

    const { id, cost, available, info, total_beds, available_beds } = req.body;

    const service = await ServiceModel.findById(id);
    if (!service) throw new NOTFOUND("BloodProvide Obj");

    service.cost = cost ? cost : service.cost;
    service.available = available != undefined ? available : service.available;
    service.total_beds = total_beds ? total_beds : service.total_beds;
    service.available_beds = available_beds
      ? available_beds
      : service.available_beds;
    service.info = info ? info : service.info;

    if (service.total_beds < service.available_beds)
      throw new ERROR("Total no bed is lower than available bed");

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

    const org = await OrgModel.findOne({ user: req.user.id });
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
