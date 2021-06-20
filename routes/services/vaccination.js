const router = require("express").Router();

const { check_for_access_token, allowAll } = require("../../middlewares/auth");
const { HandleError, NOTFOUND, ERROR } = require("../../utils/error");

const UserModel = require("../../db/models/user");
// const OrgModel = require("../../db/models/org");
const VaccinationModel = require("../../db/models/services/vaccination");
const { getBookingConstrains } = require("../../utils");

router.get("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const findByOrg = req.query?.org ? true : false;
    const dozeProvided = req.query?.doze ? true : false;
    let vaccines = [];
    let filtered_vaccines = [];

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    const dozeConstrains = dozeProvided ? { vaccine_doze: req.query.doze } : {};

    if (findByCity) {
      vaccines = await VaccinationModel.find({
        booked: false,
        ...dozeConstrains,
      }).populate(orgContrains);

      vaccines = vaccines.filter(
        (item) => item.org.address.city === req.query.city
      );
    } else if (findByDistrict) {
      vaccines = await VaccinationModel.find({
        booked: false,
        ...dozeConstrains,
      }).populate(orgContrains);

      vaccines = vaccines.filter(
        (item) => item.org.address.district === req.query.district
      );
    } else if (findByOrg) {
      vaccines = await VaccinationModel.find({
        org: req.query.org,
        booked: false,
        ...dozeConstrains,
      }).populate(orgContrains);
    } else {
      vaccines = await VaccinationModel.find({
        booked: false,
        ...dozeConstrains,
      }).populate(orgContrains);
    }

    vaccines.forEach((item) => {
      const is_exists = filtered_vaccines.find(
        (fItem) => item.batch_code === fItem.batch_code
      );

      if (!is_exists) {
        filtered_vaccines.push(item);
      }
    });

    return res.status(200).json({
      message: "Successful operation",
      services: filtered_vaccines,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.post("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    const is_batch_code_exists = req.body?.batch_code ? true : false;
    if (!is_batch_code_exists) throw new NOTFOUND("batch_code");

    const bookingConstrains = getBookingConstrains(req.body);

    const ret = await VaccinationModel.findOneAndUpdate(
      { batch_code: req.body.batch_code, booked: false },
      {
        patient: user,
        booking_date: Date.now(),
        booked: true,
        ...bookingConstrains,
      }
    );
    if (!ret) throw new ERROR("Error Ocurred", 500, { err: ret });

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.get("/booked", check_for_access_token, allowAll, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    const vaccines = await VaccinationModel.find({
      patient: user,
    }).populate(orgContrains);

    return res.status(200).json({
      message: "Successful operation",
      services: vaccines,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.delete("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) throw new NOTFOUND("user");

    const is_id_given = req.body?.id ? true : false;
    if (!is_id_given) throw new NOTFOUND("id (vaccination_id)");

    const ret = await VaccinationModel.findOneAndUpdate(
      { _id: req.body.id, done: false, patient: user },
      {
        patient: null,
        booked: false,
        booking_date: null,
        patient_details: null,
      }
    );

    if (!ret)
      throw new ERROR("Booked record not found or its already finished");

    return res.status(200).json({ message: "Successful operation" });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
