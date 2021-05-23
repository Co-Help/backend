const router = require("express").Router();
const passport = require("passport");

router.get("/register", (req, res) => {
  return res.status(200).json({ route: "Register Route" });
});

router.get("/logout", (req, res) => {
  req.logOut();
  return res.status(200).json({ route: "Logged out" });
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get("/process", passport.authenticate("google"), (req, res) => {
  return res
    .status(200)
    .json({ route: "Google OAuth Post Process", user: req.user });
});

module.exports = router;
