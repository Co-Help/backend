require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Mongodb Initialization
require("./db/mongoose")();

// Passport middleware Initialization
require("./auth/passport")((func) => app.use(func));

// CORs Middleware
const cors = require("cors");
app.use(
  cors({
    origin: true,
  })
);

// Routes
app.use("/auth", require("./auth"));

// Server
app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});
