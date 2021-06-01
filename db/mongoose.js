const mongoose = require("mongoose");

const init = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      console.log("Database connected :)");
    })
    .catch((err) => {
      console.log(err?.message ?? err);
    });
};

module.exports = init;
