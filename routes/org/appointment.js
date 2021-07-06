const router = require("express").Router();
const {
  check_for_access_token,
  allowDoctorOrg,
  allowDoctor,
} = require("../../middlewares/auth");
const { NOTFOUND, HandleError, ERROR } = require("../../utils/error");
const {
  _createAppointment,
  _editAppointment,
} = require("../../utils/validationProps");
const { GET_HTML, bold } = require("../../utils/template");
const UserModel = require("../../db/models/user");
const OrgModel = require("../../db/models/org");
const ServiceModel = require("../../db/models/services/appointment");
const ConfigModel = require("../../db/models/config");

const EMAIL_JOB = require("../../worker/email");
EMAIL_JOB.start();

router.get("/", check_for_access_token, allowDoctorOrg, async (req, res) => {
  try {
    const orgfilter =
      req.user.role === "org"
        ? {
            $or: [
              { user: req.user.id },
              { members: { $in: [req.user.email] } },
            ],
          }
        : { doctors: { $in: [req.user.id] } };
    const org = await OrgModel.findOne(orgfilter);
    if (!org) throw new NOTFOUND("Org");

    const servicefilter =
      req.user.role === "org" ? { org } : { org, doctor: req.user.id };
    const services = await ServiceModel.find(servicefilter).sort({
      appointment_date: -1,
    });
    let filteredData = [];

    for (let i = 0; i < services.length; i++) {
      let exists = filteredData.find(
        (fItem) => fItem.batch_code === services[i].batch_code
      );

      if (!exists) {
        const config = await ConfigModel.findOne({
          batch_code: services[i].batch_code,
        });
        if (!config) throw new NOTFOUND("Config");

        services[i].cost = config.cost;
        services[i].appointment_date = config.date;
        services[i].info = config.info;

        filteredData.push(services[i]);
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
  allowDoctorOrg,
  async (req, res) => {
    try {
      const orgfilter =
        req.user.role === "org"
          ? {
              $or: [
                { user: req.user.id },
                { members: { $in: [req.user.email] } },
              ],
            }
          : { doctors: { $in: [req.user.id] } };
      const org = await OrgModel.findOne(orgfilter);
      if (!org) throw new NOTFOUND("Org");

      const batch_code = req.query?.batch_code ? true : false;
      if (!batch_code) throw new NOTFOUND("Batch (batch_code)");

      const filter =
        req.user.role === "org"
          ? { org, batch_code: req.query.batch_code }
          : { doctor: req.user.id, org, batch_code: req.query.batch_code };

      const services = await ServiceModel.find(filter).sort({
        appointment_date: -1,
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

router.get(
  "/by_id",
  check_for_access_token,
  allowDoctorOrg,
  async (req, res) => {
    try {
      const orgfilter =
        req.user.role === "org"
          ? {
              $or: [
                { user: req.user.id },
                { members: { $in: [req.user.email] } },
              ],
            }
          : { doctors: { $in: [req.user.id] } };
      const org = await OrgModel.findOne(orgfilter);
      if (!org) throw new NOTFOUND("Org");

      const id_exists = req.query?.id ? true : false;
      if (!id_exists) throw new NOTFOUND("Id (service_id)");

      const servicefilter =
        req.user.role === "org"
          ? { _id: req.query.id }
          : { _id: req.query.id, doctor: req.user.id };
      const service = await ServiceModel.findOne(servicefilter);

      return res.status(200).json({
        message: "Successful operation",
        service,
      });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post(
  "/",
  check_for_access_token,
  allowDoctor,
  _createAppointment,
  async (req, res) => {
    try {
      const doctor = await UserModel.findOne({ _id: req.user.id });
      if (!doctor) throw new NOTFOUND("Doctor");

      const org = await OrgModel.findOne({ doctors: { $in: [req.user.id] } });
      if (!org) throw new NOTFOUND("Org");

      if (!org.services.doctor_appointment) {
        throw new ERROR(
          "Your org doesn't have permission to use Doctor appointment Service",
          400,
          { permission_denied: true }
        );
      }

      const { cost, appointment_date, info, quantity } = req.body;

      const batch_code = require("uuid").v4();

      for (let i = 0; i < quantity; i++) {
        const service = new ServiceModel({
          cost,
          doctor,
          org,
          appointment_date,
          info,
          batch_code,
        });
        await service.save();
      }

      const config = new ConfigModel({
        cost,
        info,
        date: appointment_date,
        batch_code,
        org,
        service: "APPOINTMENT",
      });
      await config.save();

      return res.status(200).json({ message: "Successful operation" });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.post("/add", check_for_access_token, allowDoctor, async (req, res) => {
  try {
    const user = await UserModel.exists({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Org User");

    const org = await OrgModel.findOne({ doctors: { $in: [req.user.id] } });
    if (!org) throw new NOTFOUND("Org");

    const { quantity, batch_code } = req.body;

    const config = await ConfigModel.findOne({ batch_code });
    if (!config) throw new NOTFOUND("Config");

    for (let i = 0; i < quantity; i++) {
      const service = new ServiceModel({
        cost: config.cost,
        doctor: user,
        org: org,
        appointment_date: config.date,
        info: config.info,
        batch_code: config.batch_code,
      });
      await service.save();
    }
    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post(
  "/edit",
  check_for_access_token,
  allowDoctor,
  _editAppointment,
  async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.user.id });
      if (!user) throw new NOTFOUND("Doctor");

      const org = await OrgModel.findOne({ doctors: { $in: [req.user.id] } });
      if (!org) throw new NOTFOUND("Org");

      const { cost, batch_code, info, appointment_date } = req.body;

      await ServiceModel.updateMany(
        { batch_code, org, done: false, doctor: user },
        { info, appointment_date }
      );

      await ServiceModel.updateMany(
        { batch_code, org, booked: false, doctor: user },
        { cost }
      );

      await ConfigModel.findOneAndUpdate(
        { batch_code },
        {
          cost,
          info,
          date: appointment_date,
        }
      );

      const ret = await ServiceModel.find({
        batch_code,
        org,
        done: false,
        booked: true,
        doctor: user,
      }).populate(["patient", "org"]);

      const emails = ret.map((item) => item.patient.email);

      if (emails.length !== 0) {
        EMAIL_JOB.push_email({
          email: emails,
          subject: "CoHelp Appointment Services",
          content: "",
          html: GET_HTML(
            "Rescheduled",
            false,
            `Your appointment date is rescheduled to ${bold(
              new Date(parseInt(appointment_date)).toLocaleString()
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

router.post("/done", check_for_access_token, allowDoctor, async (req, res) => {
  try {
    const doctor = await UserModel.findById(req.user.id);
    if (!doctor) throw new NOTFOUND("User");

    const id_given = req.body?.id ? true : false;
    const done = req.body.done !== undefined ? req.body.done : true;
    const otherFilter = done ? { booked: true } : { booked: false };
    if (!id_given) throw new NOTFOUND("Appointment id");

    const ret = await ServiceModel.findOneAndUpdate(
      { _id: req.body.id, doctor, ...otherFilter },
      { done }
    );
    if (!ret) throw new NOTFOUND("Appointment");

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowDoctor, async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.user.id });
    if (!user) throw new NOTFOUND("Doctor");

    const org = await OrgModel.findOne({ doctors: { $in: [req.user.id] } });
    if (!org) throw new NOTFOUND("Org");

    const id_given = req.body?.id ? true : false;
    const ids_given = req.body?.ids ? true : false;
    const batch_code_given = req.body?.batch_code ? true : false;
    const batchConstrains = batch_code_given
      ? { batch_code: req.body.batch_code }
      : {};

    let ret;

    if (id_given) {
      ret = await ServiceModel.findOneAndDelete({
        _id: req.body.id,
        booked: false,
        org,
        doctor: user,
        ...batchConstrains,
      });
    } else if (ids_given) {
      ret = await ServiceModel.deleteMany({
        _id: { $in: req.body.ids },
        booked: false,
        org,
        doctor: user,
        ...batchConstrains,
      });
    } else {
      ret = await ServiceModel.deleteMany({
        booked: false,
        org,
        doctor: user,
        ...batchConstrains,
      });
    }

    if (!ret) throw new ERROR("Error while removing", 500, { err: ret });

    // Checking if any obj left from same query
    const exists = await ServiceModel.exists({ org, ...batchConstrains });

    if (!exists) {
      await ConfigModel.deleteMany({
        org,
        ...batchConstrains,
        service: "APPOINTMENT",
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
