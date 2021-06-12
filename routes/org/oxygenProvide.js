const router = require("express").Router();
const { check_for_access_token, allowOrg } = require("../../middlewares/auth");
const { NOTFOUND, HandleError, ERROR } = require("../../utils/error");
const { _createOxygenProvide } = require("../../utils/validationProps");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const ServiceModel = require("../../db/models/services/oxygenProvide");

router.get("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.findOne({ user: req.user.id });
    if (!org) throw new NOTFOUND("Org");

    const services = await ServiceModel.find({ org });
    let filteredData = [];

    services.forEach((item) => {
      const exists = filteredData.find(
        (fItem) => fItem.batch_code === item.batch_code
      );

      if (!exists) {
        filteredData.push(item);
      }
    });

    return res.status(200).json({
      message: "Successful operation",
      services: filteredData,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.get(
  "/by_batch_code",
  check_for_access_token,
  allowOrg,
  async (req, res) => {
    try {
      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new NOTFOUND("Org");

      const batch_code = req.query?.batch_code ? true : false;
      if (!batch_code) throw new NOTFOUND("Batch (batch_code)");

      const services = await ServiceModel.find({
        org,
        batch_code: req.query.batch_code,
      });

      return res.status(200).json({
        message: "Successful operation",
        services: services,
      });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.get("/by_id", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.exists({ user: req.user.id });
    if (!org) throw new NOTFOUND("Org");

    const id_exists = req.query?.id ? true : false;
    if (!id_exists) throw new NOTFOUND("Id (service_id)");

    const service = await ServiceModel.findById(req.query.id);

    return res.status(200).json({
      message: "Successful operation",
      service,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/",
  check_for_access_token,
  allowOrg,
  _createOxygenProvide,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new NOTFOUND("Org");

      const { cost, info, quantity, capacity } = req.body;

      const batch_code = require("uuid").v4();

      for (let i = 0; i < quantity; i++) {
        const service = new ServiceModel({
          cost,
          capacity,
          info,
          batch_code,
          org,
        });
        await service.save();
      }
      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post("/add", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({ user: req.user.id });
    if (!org) throw new NOTFOUND("Org");

    const { quantity, batch_code } = req.body;

    const oneObj = await ServiceModel.findOne({ batch_code, org });
    if (!oneObj)
      throw new ERROR(
        "Can't able to add because no branch is available.",
        404,
        { invalid_batch_code: true }
      );

    for (let i = 0; i < quantity; i++) {
      const service = new ServiceModel({
        cost: oneObj.cost,
        capacity: oneObj.capacity,
        info: oneObj.info,
        batch_code: oneObj.batch_code,
        org: oneObj.org,
      });
      await service.save();
    }
    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post("/edit", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({ user: req.user.id });
    if (!org) throw new NOTFOUND("Org");

    const { cost, capacity, info, batch_code } = req.body;

    await ServiceModel.updateMany({ batch_code, org, done: false }, { info });

    await ServiceModel.updateMany(
      { batch_code, org, booked: false },
      { cost, capacity }
    );

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
    const ids_given = req.body?.ids ? true : false;
    const batch_given = req.body?.batch_code ? true : false;

    let batch_constrains = batch_given
      ? { batch_code: req.body.batch_code }
      : {};

    let ret;

    if (id_given) {
      ret = await ServiceModel.findOneAndDelete({
        _id: req.body.id,
        booked: false,
        org,
        ...batch_constrains,
      });
    } else if (ids_given) {
      ret = await ServiceModel.deleteMany({
        _id: { $in: req.body.ids },
        booked: false,
        org,
        ...batch_constrains,
      });
    } else {
      ret = await ServiceModel.deleteMany({
        booked: false,
        ...batch_constrains,
      });
    }

    if (!ret) throw new ERROR("Error while removing", 500, { err: ret });

    return res
      .status(200)
      .json({ message: "Successful operation", status: ret });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
