const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

module.exports.generateOTP = () => {
  const OTP = otpGenerator.generate(6, {
    specialChars: false,
  });

  return OTP;
};

module.exports.sendOTPEmail = (email, otp) => {
  const transporter = nodemailer.createTransport(
    smtpTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_PASSWORD,
      },
    })
  );

  var mailOptions = {
    from: process.env.MAIL_EMAIL,
    to: email,
    subject: "Instello Login OTP",
    text: `Your OTP to login is: ${otp}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
