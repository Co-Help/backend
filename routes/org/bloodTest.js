const router = require("express").Router();
const { check_for_access_token, allowOrg } = require("../../middlewares/auth");
const { NOTFOUND, HandleError, ERROR } = require("../../utils/error");
const {
  _createBloodTest,
  _addBloodTest,
  _editBloodTest,
} = require("../../utils/validationProps");
const { GET_HTML, bold } = require("../../utils/template");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const BloodTestModel = require("../../db/models/services/bloodTest");
const ConfigModel = require("../../db/models/config");

const EMAIL_JOB = require("../../worker/email");
EMAIL_JOB.start();

router.get("/", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const org = await OrgModel.findOne({
      $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
    });
    if (!org) throw new NOTFOUND("Org");

    const blood_tests = await BloodTestModel.find({ org });
    let filteredData = [];

    for (let i = 0; i < blood_tests.length; i++) {
      const exists = filteredData.find(
        (fItem) => fItem.batch_code === blood_tests[i].batch_code
      );

      if (!exists) {
        const config = await ConfigModel.findOne({
          batch_code: blood_tests[i].batch_code,
        });
        if (!config) throw new NOTFOUND("Config");

        blood_tests[i].cost = config.cost;
        blood_tests[i].test_date = config.date;
        blood_tests[i].info = config.info;

        filteredData.push(blood_tests[i]);
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

      const blood_tests = await BloodTestModel.find({
        org,
        batch_code: req.query.batch_code,
      });

      return res.status(200).json({
        message: "Successful operation",
        services: blood_tests,
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
    if (!id_exists) throw new NOTFOUND("Id (blood_test_id)");

    const blood_test = await BloodTestModel.findById(req.query.id);

    return res.status(200).json({
      message: "Successful operation",
      blood_test,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/",
  check_for_access_token,
  allowOrg,
  _createBloodTest,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new NOTFOUND("Org");

      if (!org.services.blood_test) {
        throw new ERROR(
          "Your org doesn't have permission to use Blood Test Service",
          400,
          { permission_denied: true }
        );
      }

      const { cost, info, quantity, test_date } = req.body;

      const batch_code = require("uuid").v4();

      for (let i = 0; i < quantity; i++) {
        const blood_test = new BloodTestModel({
          cost,
          info,
          test_date,
          batch_code,
          org,
        });
        await blood_test.save();
      }

      const config = new ConfigModel({
        cost,
        info,
        date: test_date,
        batch_code,
        org,
        service: "BLOOD_TEST",
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
  _addBloodTest,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new NOTFOUND("Org");

      const { quantity, batch_code } = req.body;

      const config = await ConfigModel.findOne({ batch_code });
      if (!config) throw new NOTFOUND("Config");

      for (let i = 0; i < quantity; i++) {
        const blood_test = new BloodTestModel({
          cost: config.cost,
          info: config.info,
          test_date: config.date,
          batch_code: config.batch_code,
          org,
        });
        await blood_test.save();
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
  _editBloodTest,
  async (req, res) => {
    try {
      const user = await UserModel.exists({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Org User");

      const org = await OrgModel.findOne({
        $or: [{ user: req.user.id }, { members: { $in: [req.user.email] } }],
      });
      if (!org) throw new NOTFOUND("Org");

      const { cost, batch_code, info, test_date } = req.body;

      await BloodTestModel.updateMany(
        { batch_code, org, done: false },
        { info, test_date }
      );

      await BloodTestModel.updateMany(
        { batch_code, org, booked: false },
        { cost }
      );

      await ConfigModel.findOneAndUpdate(
        { batch_code },
        {
          cost,
          info,
          date: test_date,
        }
      );

      const ret = await BloodTestModel.find({
        batch_code,
        org,
        done: false,
        booked: true,
      }).populate(["patient", "org"]);

      const emails = ret.map((item) => item.patient.email);

      if (emails.length !== 0) {
        EMAIL_JOB.push_email({
          email: emails,
          subject: "CoHelp Blood Test Services",
          content: "",
          html: GET_HTML(
            "Rescheduled",
            false,
            `Your test date is rescheduled to ${bold(
              new Date(parseInt(test_date)).toLocaleString()
            )}.\n\nFor any query our helpline no. ${bold(
              ret[0].org.helpline_no
            )}`
          ),
        });
      }

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

    await BloodTestModel.updateOne(
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

    const id_given = req.body?.id ? true : false;
    const ids_given = req.body?.ids ? true : false;

    const batch_code_given = req.body?.batch_code ? true : false;
    const batchConstrains = batch_code_given
      ? { batch_code: req.body.batch_code }
      : {};

    let ret;

    if (id_given) {
      ret = await BloodTestModel.findOneAndDelete({
        _id: req.body.id,
        booked: false,
        org,
        ...batchConstrains,
      });
    } else if (ids_given) {
      ret = await BloodTestModel.deleteMany({
        _id: { $in: req.body.ids },
        booked: false,
        org,
        ...batchConstrains,
      });
    } else {
      ret = await BloodTestModel.deleteMany({
        booked: false,
        org,
        ...batchConstrains,
      });
    }

    if (!ret) throw new ERROR("Error while removing", 500, { err: ret });

    // Checking if any obj left from same query
    const exists = await BloodTestModel.exists({ org, ...batchConstrains });

    if (!exists) {
      await ConfigModel.deleteMany({
        org,
        ...batchConstrains,
        service: "BLOOD_TEST",
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
