const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const CryptoJS = require("crypto-js");

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

module.exports.encrypt = (message) => {
  if (!message) return message;

  const encryptedText = CryptoJS.AES.encrypt(
    message,
    process.env.CRYPTO_SECRET_KEY
  ).toString();

  return encryptedText;
};

module.exports.decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;

  const bytes = CryptoJS.AES.decrypt(
    encryptedText,
    process.env.CRYPTO_SECRET_KEY
  );
  const originalText = bytes.toString(CryptoJS.enc.Utf8);

  return originalText;
};
