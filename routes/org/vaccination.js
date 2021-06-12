const router = require("express").Router();
const { check_for_access_token, allowOrg } = require("../../middlewares/auth");
const { NOTFOUND, HandleError, ERROR, INVALID } = require("../../utils/error");
const {
  _createVaccination,
  _addVaccination,
  _editVaccination,
} = require("../../utils/validationProps");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const VaccinationModel = require("../../db/models/services/vaccination");

router.get("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.findOne({ user: req.user.id });
    if (!org) throw new NOTFOUND("Org");

    const vaccines = await VaccinationModel.find({ org });
    let filteredData = [];

    vaccines.forEach((item) => {
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

      const vaccines = await VaccinationModel.find({
        org,
        batch_code: req.query.batch_code,
      });

      return res.status(200).json({
        message: "Successful operation",
        services: vaccines,
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
    if (!id_exists) throw new NOTFOUND("Id (vaccine_id)");

    const vaccine = await VaccinationModel.findById(req.query.id);

    return res.status(200).json({
      message: "Successful operation",
      vaccine,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/",
  check_for_access_token,
  allowOrg,
  _createVaccination,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new NOTFOUND("Org");

      const {
        cost,
        info,
        quantity,
        min_age,
        max_age,
        vaccine_name,
        vaccine_doze,
        vaccine_date,
      } = req.body;

      if (!(vaccine_doze === "1ST" || vaccine_doze === "2ND")) {
        throw new INVALID("vaccine_doze");
      }

      const batch_code = require("uuid").v4();

      for (let i = 0; i < quantity; i++) {
        const vaccine = new VaccinationModel({
          cost,
          age_restriction: { min_age, max_age },
          info,
          org,
          vaccine_name,
          vaccine_doze,
          vaccine_date,
          batch_code,
        });
        await vaccine.save();
      }
      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/add",
  check_for_access_token,
  allowOrg,
  _addVaccination,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new NOTFOUND("Org");

      const { quantity, batch_code } = req.body;

      const oneObj = await VaccinationModel.findOne({ batch_code, org });
      if (!oneObj)
        throw new ERROR(
          "Can't able to add because no branch is available.",
          404,
          { invalid_batch_code: true }
        );

      for (let i = 0; i < quantity; i++) {
        const vaccine = new VaccinationModel({
          cost: oneObj.cost,
          age_restriction: oneObj.age_restriction,
          info: oneObj.info,
          org: oneObj.org,
          vaccine_name: oneObj.vaccine_name,
          vaccine_doze: oneObj.vaccine_doze,
          vaccine_date: oneObj.vaccine_date,
          batch_code: oneObj.batch_code,
        });
        await vaccine.save();
      }
      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/edit",
  check_for_access_token,
  allowOrg,
  _editVaccination,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new NOTFOUND("Org");

      const {
        cost,
        batch_code,
        info,
        min_age,
        max_age,
        vaccine_date,
        vaccine_name,
      } = req.body;

      const age_restriction = {
        min_age,
        max_age,
      };

      await VaccinationModel.updateMany(
        { batch_code, org, done: false },
        { info, vaccine_date }
      );

      await VaccinationModel.updateMany(
        { batch_code, org, booked: false },
        { cost, age_restriction, vaccine_name }
      );

      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.delete("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({ user: req.user.id });
    if (!org) throw new NOTFOUND("Org");

    const id_given = req.body?.id ? true : false;
    const ids_given = req.body?.ids ? true : false;

    let ret;

    if (id_given) {
      ret = await VaccinationModel.findOneAndDelete({
        _id: req.body.id,
        booked: false,
        org,
      });
    } else if (ids_given) {
      ret = await VaccinationModel.deleteMany({
        _id: { $in: req.body.ids },
        booked: false,
        org,
      });
    } else {
      ret = await VaccinationModel.deleteMany({ booked: false });
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