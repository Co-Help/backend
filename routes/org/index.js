const router = require("express").Router();
const {
  check_for_access_token,
  allowOrg,
  allowUser,
} = require("../../middlewares/auth");
const { NOTFOUND, HandleError, ERROR, INVALID } = require("../../utils/error");
const OrgModel = require("../../db/models/org");
const UserModel = require("../../db/models/user");
const ApplicationModel = require("../../db/models/application");
const { v4 } = require("uuid");
const utils = require("../../utils/index");

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

// Add Member
router.post("/member", check_for_access_token, allowOrg, async (req, res) => {
  try {
    const email_provided = req.body.email !== undefined ? true : false;
    if (!email_provided) throw new NOTFOUND("email");

    const email = req.body.email.toLowerCase();

    if (!utils.email.test(email)) throw new INVALID("email");

    // Checking if user is org admin or not
    const orgAdmin = await OrgModel.findOne({ user: req.user.id });
    if (!orgAdmin) throw new NOTFOUND("Org");

    // Checking if email already applied for org
    const eApplicationExists = await ApplicationModel.findOne({
      "admin.email": email,
    });
    if (eApplicationExists)
      throw new ERROR("Provided email already applied for ORG");

    // Checking if provided email already a member of org or not
    const eOrgExists = await OrgModel.exists({
      $or: [{ admin: email }, { members: { $in: [email] } }],
    });
    if (eOrgExists)
      throw new ERROR("This email already under an organization.");

    // Checking if Email have any user account
    const eUserExists = await UserModel.exists({ email });
    if (eUserExists)
      throw new ERROR(
        "User account already exists. Delete account then apply."
      );

    orgAdmin.members.push(email);
    await orgAdmin.save();

    return res.status(200).json({ message: "Successful Operation" });
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
