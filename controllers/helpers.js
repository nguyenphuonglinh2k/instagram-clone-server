const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const CryptoJS = require("crypto-js");

const CRYPTO_KEY = CryptoJS.enc.Utf8.parse(
  process.env.CRYPTO_SECRET_KEY_IN_UTF8 || ""
);

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

  const encryptedText = CryptoJS.AES.encrypt(message, CRYPTO_KEY, {
    mode: CryptoJS.mode.ECB,
  }).toString();

  return encryptedText;
};

module.exports.decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;

  const bytes = CryptoJS.AES.decrypt(encryptedText, CRYPTO_KEY, {
    mode: CryptoJS.mode.ECB,
  });
  const originalText = bytes.toString(CryptoJS.enc.Utf8);

  return originalText;
};

module.exports.decryptOneUserData = (
  object = { name: "", email: "", bio: "", userImageUrl: "" }
) => {
  if (object) {
    const { name, email, bio, userImageUrl } = object;

    return {
      ...object,
      ...(name ? { name: this.decrypt(name) } : {}),
      ...(email ? { email: this.decrypt(email) } : {}),
      ...(bio ? { bio: this.decrypt(bio) } : {}),
      ...(userImageUrl ? { userImageUrl: this.decrypt(userImageUrl) } : {}),
    };
  } else {
    return {};
  }
};
