require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// CORS
app.use(require("cors")());

app.use(express.json());

// DB Initialization
require("./db/mongoose")();

// Routes
app.use("/test", require("./routes/test"));
app.use("/auth", require("./routes/auth"));

app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});
