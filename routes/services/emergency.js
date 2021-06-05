const router = require("express").Router();
const { check_for_access_token, allowAll } = require("../../middlewares/auth");
const EmergencyModel = require("../../db/models/services/emergencyProvide");

router.get("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const findByCity = req.body?.city ? true : false;
    const findByDistrict = req.body?.district ? true : false;
    const findByOrg = req.body?.org ? true : false;
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
        (item) => item.org.address.city === req.body.city
      );
    }

    if (findByDistrict) {
      emergencies = await EmergencyModel.find({ available: true }).populate(
        orgContrains
      );

      emergencies = emergencies.filter(
        (item) => item.org.address.district === req.body.district
      );
    }

    if (findByOrg) {
      emergencies = await EmergencyModel.find({
        org: req.body.org,
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
