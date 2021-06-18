const router = require("express").Router();
const { check_for_access_token, allowAll } = require("../../middlewares/auth");
const ServiceModel = require("../../db/models/services/bedProvide");

router.get("/", check_for_access_token, allowAll, async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const findByOrg = req.query?.org ? true : false;
    let services = [];

    const orgContrains = {
      path: "org",
      select: ["name", "logo_url", "helpline_no", "address"],
    };

    if (findByCity) {
      services = await ServiceModel.find({
        available: true,
      }).populate(orgContrains);

      services = services.filter(
        (item) => item.org.address.city === req.query.city
      );
    }

    if (findByDistrict) {
      services = await ServiceModel.find({
        available: true,
      }).populate(orgContrains);

      services = services.filter(
        (item) => item.org.address.district === req.query.district
      );
    }

    if (findByOrg) {
      services = await ServiceModel.find({
        org: req.query.org,
        available: true,
      }).populate(orgContrains);
    }

    return res.status(200).json({
      message: "Successful operation",
      services: services,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

module.exports = router;
