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
app.use("/user", require("./routes/user"));
app.use("/application", require("./routes/org/application"));
app.use("/doctor", require("./routes/org/doctor"));
app.use("/org", require("./routes/org/index"));
app.use("/notification", require("./routes/system/notification"));

//Service Routes
app.use("/services/appointment", require("./routes/services/appointment"));

app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});
