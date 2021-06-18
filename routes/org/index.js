const router = require("express").Router();
const {
  check_for_access_token,
  allowOrg,
  allowUser,
} = require("../../middlewares/auth");
const { NOTFOUND, HandleError } = require("../../utils/error");
const OrgModel = require("../../db/models/org");
const { v4 } = require("uuid");

router.get(
  "/generate_pass_key",
  check_for_access_token,
  allowOrg,
  async (req, res) => {
    try {
      const org = await OrgModel.findOne({ user: req.user.id });
      if (!org) throw new NOTFOUND("Org");

      org.pass_key = v4();
      await org.save();

      return res.status(200).json({
        message: "Successfully generated pass key",
        org,
      });
    } catch (err) {
      return HandleError(err, res);
    }
  }
);

router.get("/", check_for_access_token, allowUser, async (req, res) => {
  try {
    const findByCity = req.query?.city ? true : false;
    const findByDistrict = req.query?.district ? true : false;
    const keywordsGiven = req.query?.search ? true : false;
    let orgs = [];

    const searchConstrains = keywordsGiven
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { info: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    if (findByCity || findByDistrict) {
      if (findByCity) {
        orgs = await OrgModel.find({
          address: { city: req.query.city },
          ...searchConstrains,
        })
          .select(["-pass_key"])
          .populate("doctors");
      }

      if (findByDistrict) {
        orgs = await OrgModel.find({
          address: { city: req.query.district },
          ...searchConstrains,
        })
          .select(["-pass_key"])
          .populate("doctors");
      }
    } else {
      orgs = await OrgModel.find({ ...searchConstrains })
        .select(["-pass_key"])
        .populate("doctors");
    }

    return res.status(200).json({
      message: "Successful operation",
      appointments: orgs,
    });
  } catch (err) {
    return HandleError(err, res);
  }
});

router.use("/emergency", require("./emergency"));
router.use("/blood_test", require("./bloodTest"));
router.use("/blood_provide", require("./bloodProvide"));
router.use("/oxygen_provide", require("./oxygenProvide"));
router.use("/bed_provide", require("./bedProvide"));
router.use("/vaccination", require("./vaccination"));
router.use("/appointment", require("./appointment"));

module.exports = router;
