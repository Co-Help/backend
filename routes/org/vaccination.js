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
const NotificationModel = require("../../db/models/notification");
const ConfigModel = require("../../db/models/config");

router.get("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const vaccines = await VaccinationModel.find({ org });
    let filteredData = [];

    for (let i = 0; i < vaccines.length; i++) {
      const exists = filteredData.find(
        (fItem) => fItem.batch_code === vaccines[i].batch_code
      );

      if (!exists) {
        const config = await ConfigModel.findOne({
          batch_code: vaccines[i].batch_code,
        });
        if (!config) throw new NOTFOUND("Config");

        vaccines[i].cost = config.cost;
        vaccines[i].vaccine_date = config.date;
        vaccines[i].info = config.info;
        vaccines[i].vaccine_name = config.vaccine_name;
        vaccines[i].min_age = config.min_age;
        vaccines[i].max_age = config.max_age;

        filteredData.push(vaccines[i]);
      }
    }

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
      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
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
    const org = await OrgModel.exists({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
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

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new NOTFOUND("Org");

      if (!org.services.vaccination) {
        throw new ERROR(
          "Your org doesn't have permission to use Vaccination Service",
          400,
          { permission_denied: true }
        );
      }

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

      const config = new ConfigModel({
        cost,
        min_age,
        max_age,
        info,
        batch_code,
        org,
        vaccine_name,
        date: vaccine_date,
        service: "VACCINE",
      });
      await config.save();

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

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new NOTFOUND("Org");

      const { quantity, batch_code } = req.body;

      const oneObj = await VaccinationModel.findOne({ batch_code, org });
      if (!oneObj)
        throw new ERROR(
          "Can't able to add because no branch is available.",
          404,
          { invalid_batch_code: true }
        );

      const config = await ConfigModel.findOne({ batch_code, org });
      if (!config) throw new NOTFOUND("Config");

      for (let i = 0; i < quantity; i++) {
        const vaccine = new VaccinationModel({
          cost: config.cost,
          age_restriction: { min_age: config.min_age, max_age: config.max_age },
          info: config.info,
          org: config.org,
          vaccine_name: config.vaccine_name,
          vaccine_doze: oneObj.vaccine_doze,
          vaccine_date: config.date,
          batch_code: config.batch_code,
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

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
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

      await ConfigModel.findOneAndUpdate(
        { batch_code },
        {
          cost,
          info,
          min_age,
          max_age,
          date: vaccine_date,
          vaccine_name,
        }
      );

      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post("/done", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const idProvided = req.body?.id ? true : false;
    const doneProvided = req.body.done != undefined ? true : false;

    if (!doneProvided || !idProvided)
      throw new NOTFOUND("done: boolean or id: string");

    await VaccinationModel.updateOne(
      { _id: req.body.id, org, booked: true },
      { done: req.body.done }
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

    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const batch_code_given = req.body?.batch_code ? true : false;
    const id_given = req.body?.id ? true : false;
    const ids_given = req.body?.ids ? true : false;

    let ret;

    const batchConstraints = batch_code_given
      ? { batch_code: req.body.batch_code }
      : {};

    if (id_given) {
      ret = await VaccinationModel.findOneAndDelete({
        _id: req.body.id,
        booked: false,
        org,
        ...batchConstraints,
      });
    } else if (ids_given) {
      ret = await VaccinationModel.deleteMany({
        _id: { $in: req.body.ids },
        booked: false,
        org,
        ...batchConstraints,
      });
    } else {
      ret = await VaccinationModel.deleteMany({
        booked: false,
        org,
        ...batchConstraints,
      });
    }

    // Checking if any obj left from same query
    const exists = await VaccinationModel.exists({ org, ...batchConstraints });

    if (!exists) {
      await ConfigModel.deleteMany({
        org,
        ...batchConstraints,
        service: "VACCINE",
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

router.delete("/force", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    if (!req.body.reason || typeof req.body.reason != "string") {
      throw new NOTFOUND("Reason (reason: String)");
    }

    const batch_code_given = req.body?.batch_code ? true : false;
    const id_given = req.body?.id ? true : false;
    const ids_given = req.body?.ids ? true : false;

    const batchConstraints = batch_code_given
      ? { batch_code: req.body.batch_code }
      : {};

    let ret;

    if (id_given) {
      ret = await VaccinationModel.findOne({
        _id: req.body.id,
        done: false,
        org,
        ...batchConstraints,
      });

      if (!ret) throw new NOTFOUND("Vaccine");

      await NotificationModel.create({
        title: "Booking cancelled",
        info: req.body.reason,
        time: Date.now(),
        user: ret.patient,
      });
      await ret.remove();
    } else if (ids_given) {
      ret = await VaccinationModel.find({
        _id: { $in: req.body.ids },
        done: false,
        org,
        ...batchConstraints,
      });

      let notificationBulk = [];

      ret.forEach((item) => {
        notificationBulk.push({
          title: "Booking cancelled",
          info: req.body.reason,
          time: Date.now(),
          user: item.patient,
        });
      });

      await NotificationModel.insertMany(notificationBulk);

      ret = await VaccinationModel.deleteMany({
        _id: { $in: req.body.ids },
        done: false,
        org,
        ...batchConstraints,
      });
    } else {
      ret = await VaccinationModel.find({
        done: false,
        org,
        ...batchConstraints,
      });

      let notificationBulk = [];

      ret.forEach((item) => {
        notificationBulk.push({
          title: "Booking cancelled",
          info: req.body.reason,
          time: Date.now(),
          user: item.patient,
        });
      });

      await NotificationModel.insertMany(notificationBulk);

      ret = await VaccinationModel.deleteMany({
        done: false,
        org,
        ...batchConstraints,
      });
    }

    if (!ret) throw new ERROR("Error while removing", 500, { err: ret });

    // Checking if any obj left from same query
    const exists = await VaccinationModel.exists({ org, ...batchConstraints });

    if (!exists) {
      await ConfigModel.deleteMany({
        org,
        ...batchConstraints,
        service: "VACCINE",
      });
    }

    return res
      .status(200)
      .json({ message: "Successful operation", status: ret });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
