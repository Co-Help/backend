const router = require("express").Router();
const { check_for_access_token, allowAll } = require("../../middlewares/auth");
const EmergencyModel = require("../../db/models/services/emergencyProvide");

router.get("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const findByOrg = req.query?.org ? true : false;
    let emergencies = [];

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    if (findByCity) {
      emergencies = await EmergencyModel.find({ available: true }).populate(
        orgContrains
      );

      emergencies = emergencies.filter(
        (item) => item.org.address.city === req.query.city
      );
    }

    if (findByDistrict) {
      emergencies = await EmergencyModel.find({ available: true }).populate(
        orgContrains
      );

      emergencies = emergencies.filter(
        (item) => item.org.address.district === req.query.district
      );
    }

    if (findByOrg) {
      emergencies = await EmergencyModel.find({
        org: req.query.org,
        available: true,
      }).populate(orgContrains);
    }

    return res.status(200).json({
      message: "Successful operation",
      services: emergencies,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
