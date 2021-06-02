const nodemailer = require("nodemailer");

const sendMail = async (email, subject, content, html = "") => {
  // We will use That in Production

  // let transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     type: "OAuth2",
  //     user: process.env.MAIL_USERNAME,
  //     clientId: process.env.CLIENT_ID,
  //     clientSecret: process.env.CLIENT_SECRET,
  //     refreshToken: process.env.CLIENT_REFRESH_TOKEN,
  //     accessToken: process.env.CLIENT_ACCESS_TOKEN,
  //   },
  // });

  // return await transporter.sendMail({
  //   from: process.env.MAIL_USERNAME,
  //   to: email,
  //   subject,
  //   text: content,
  //   html,
  // });

  return true;
};

module.exports = { sendMail };
