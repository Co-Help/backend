const router = require("express").Router();
const { check_for_access_token, allowOrg } = require("../../middlewares/auth");
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

module.exports = router;
