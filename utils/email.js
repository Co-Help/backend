const nodemailer = require("nodemailer");

const sendMail = async (email, subject, content, html = "") => {
  // We will use That in Production

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  return await transporter.sendMail({
    from: `"CoHelp" <${process.env.MAIL_USERNAME}>`,
    to: email,
    subject,
    text: content,
    html,
  });
};

module.exports = { sendMail };
