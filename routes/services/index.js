const router = require("express").Router();
const { HandleError } = require("../../utils/error");
const { check_for_access_token } = require("../../middlewares/auth");

const VaccinationModel = require("../../db/models/services/vaccination");
const BloodTestModel = require("../../db/models/services/bloodTest");
const BloodProvideModel = require("../../db/models/services/bloodProvide");
const OxygenModel = require("../../db/models/services/oxygenProvide");
const BedModel = require("../../db/models/services/bedProvide");
const EmergencyModel = require("../../db/models/services/emergencyProvide");
const AppointmentModel = require("../../db/models/services/appointment");

const filterOut = (arr) => {
  let retArr = [];
  arr.forEach((item) => {
    const is_exists = retArr.find(
      (fItem) => item.batch_code === fItem.batch_code
    );

    if (!is_exists) {
      retArr.push(item);
    }
  });
  return retArr;
};

router.get("/search", check_for_access_token, async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const keywordsGiven = req.query?.search ? true : false;

    let find_vaccination = req.query?.vaccination ? true : false;
    let find_blood_test = req.query?.blood_test ? true : false;
    let find_blood_provide = req.query?.blood_provide ? true : false;
    let find_oxygen_provide = req.query?.oxygen_provide ? true : false;
    let find_bed_provide = req.query?.bed_provide ? true : false;
    let find_appointment = req.query?.appointment ? true : false;
    let find_emergency_provide = req.query?.emergency_provide ? true : false;

    if (
      !find_vaccination &&
      !find_blood_test &&
      !find_blood_provide &&
      !find_oxygen_provide &&
      !find_bed_provide &&
      !find_appointment &&
      !find_emergency_provide
    ) {
      find_vaccination = true;
      find_blood_test = true;
      find_blood_provide = true;
      find_oxygen_provide = true;
      find_bed_provide = true;
      find_appointment = true;
      find_emergency_provide = true;
    }

    const searchConstrains = keywordsGiven
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { info: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    let vaccinations = [];
    let blood_tests = [];
    let blood_provides = [];
    let oxygen_provides = [];
    let bed_provides = [];
    let appointments = [];
    let emergencies = [];

    if (find_vaccination) {
      const dozeProvided = req.query?.doze ? true : false;
      const dozeConstrains = dozeProvided
        ? { vaccine_doze: req.query.doze }
        : {};

      vaccinations = await VaccinationModel.find({
        ...searchConstrains,
        booked: false,
        ...dozeConstrains,
      }).populate(orgContrains);
    }

    if (find_blood_test) {
      blood_tests = await BloodTestModel.find({
        ...searchConstrains,
        booked: false,
      }).populate(orgContrains);
    }

    if (find_blood_provide) {
      const groupProvided = req.query?.group ? true : false;
      const groupConstrains = groupProvided ? { group: req.query.group } : {};

      blood_provides = await BloodProvideModel.find({
        ...searchConstrains,
        ...groupConstrains,
        available: true,
      }).populate(orgContrains);
    }

    if (find_oxygen_provide) {
      oxygen_provides = await OxygenModel.find({
        ...searchConstrains,
        booked: false,
      }).populate(orgContrains);
    }

    if (find_bed_provide) {
      bed_provides = await BedModel.find({
        ...searchConstrains,
        available: true,
      }).populate(orgContrains);
    }

    if (find_appointment) {
      appointments = await AppointmentModel.find({
        ...searchConstrains,
        booked: false,
      })
        .populate(orgContrains)
        .populate({
          path: "doctor",
          select: ["name", "address", "doctor_info.active"],
          match: { "doctor_info.active": { $eq: true } },
        });
      appointments = appointments.filter((item) => item.doctor !== null);
    }

    if (find_emergency_provide) {
      emergencies = await EmergencyModel.find({
        ...searchConstrains,
        available: true,
      }).populate(orgContrains);
    }

    if (findByCity) {
      vaccinations = vaccinations.filter(
        (item) => item.org.address.city === req.query.city
      );

      blood_tests = blood_tests.filter(
        (item) => item.org.address.city === req.query.city
      );

      blood_provides = blood_provides.filter(
        (item) => item.org.address.city === req.query.city
      );

      oxygen_provides = oxygen_provides.filter(
        (item) => item.org.address.city === req.query.city
      );

      bed_provides = bed_provides.filter(
        (item) => item.org.address.city === req.query.city
      );

      appointments = appointments.filter(
        (item) => item.org.address.city === req.query.city
      );

      emergencies = emergencies.filter(
        (item) => item.org.address.city === req.query.city
      );
    }

    if (findByDistrict) {
      vaccinations = vaccinations.filter(
        (item) => item.org.address.district === req.query.district
      );

      blood_tests = blood_tests.filter(
        (item) => item.org.address.district === req.query.district
      );

      blood_provides = blood_provides.filter(
        (item) => item.org.address.district === req.query.district
      );

      oxygen_provides = oxygen_provides.filter(
        (item) => item.org.address.district === req.query.district
      );

      bed_provides = bed_provides.filter(
        (item) => item.org.address.district === req.query.district
      );

      appointments = appointments.filter(
        (item) => item.org.address.district === req.query.district
      );

      emergencies = emergencies.filter(
        (item) => item.org.address.district === req.query.district
      );
    }

    vaccinations = filterOut(vaccinations);
    blood_tests = filterOut(blood_tests);
    blood_provides = filterOut(blood_provides);
    oxygen_provides = filterOut(oxygen_provides);
    bed_provides = filterOut(bed_provides);
    appointments = filterOut(appointments);
    emergencies = filterOut(emergencies);

    return res.status(200).json({
      message: "Successful operation",
      results: {
        vaccinations,
        blood_tests,
        blood_provides,
        oxygen_provides,
        bed_provides,
        appointments,
        emergencies,
      },
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.use("/appointment", require("./appointment"));
router.use("/emergency", require("./emergency"));
router.use("/blood_test", require("./bloodTest"));
router.use("/blood_provide", require("./bloodProvide"));
router.use("/oxygen_provide", require("./oxygenProvide"));
router.use("/vaccination", require("./vaccination"));

module.exports = router;
