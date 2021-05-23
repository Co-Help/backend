const router = require("express").Router();

router.get("/sample", (req, res) => {
  res.status(200).json({
    token: "djbasdljbnasbdajsdasdn;alsdsa",
    payload: [
      {
        name: "Foo Bar",
        age: 69,
      },
      {
        name: "John Doe",
        age: 96,
      },
    ],
    query: req?.query ?? null,
  });
});

module.exports = router;
