require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// CORS
app.use(require("cors")());

// Test route
app.use("/test", require("./routes/test"));

app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});
