require("dotenv").config();

const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
var jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const Session = require("../models/session.model");

const {
  generateOTP,
  sendOTPEmail,
  encrypt,
  decrypt,
  decryptOneUserData,
} = require("./helpers");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.postSignIn = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please add all the fields" });
  }

  const emailExtension = email.slice(-10);

  if (emailExtension !== "@gmail.com")
    return res.status(400).json({ error: "Email is invalid" });

  // Check has encoded data
  if (process.env.IS_ENCODE_USER_INFO === "true") {
    email = encrypt(email);
  }

  let user = await User.findOne({ email }).lean(); // Mongoose Document -> Plain object js when use lean method

  // Check has encoded data
  if (process.env.IS_ENCODE_USER_INFO === "true") {
    // Decrypt user data
    user = decryptOneUserData(user);
  }

  if (!user) return res.status(400).json({ error: "Email is not exist" });

  bcrypt.compare(password, user.password, async function (err, result) {
    if (!result) {
      return res
        .status(400)
        .json({ error: "Password is wrong. Please try again" });
    }

    const token = jwt.sign({ user }, process.env.JWT_KEY, { expiresIn: "24h" });

    // Send OTP to user's mail in order to confirm login session
    const OTP = generateOTP();
    sendOTPEmail(process.env.MAIL_EMAIL, OTP);

    const now = new Date();

    // Store OTP and creation time in DB
    await Session.findOneAndUpdate(
      { email },
      { email, otp: OTP, createdAt: now },
      { upsert: true }
    );

    delete user.password;

    return res.json({
      token,
      user,
    });
  });
};

module.exports.confirmOtp = async (req, res) => {
  let { otp, email } = req.body;

  // Check has encoded data
  if (process.env.IS_ENCODE_USER_INFO === "true") {
    email = encrypt(email);
  }

  // Check OTP and expired time
  const session = await Session.findOne({ email });

  if (!session) return res.status(400).json({ message: "Email is not exist" });

  const now = new Date();
  const seconds = (now.getTime() - session.createdAt.getTime()) / 1000;

  if (
    session.otp === otp &&
    seconds > 0 &&
    seconds <= process.env.EXPIRED_TIME_OTP_IN_SECOND
  ) {
    res.status(200).json({ message: "Confirm successfully" });
  } else {
    res.status(401).json({ message: "OPT code is expired" });
  }
};

module.exports.postSignUp = (req, res) => {
  let { name, email, password } = req.body;
  let userImageUrl =
    "https://res.cloudinary.com/coders-tokyo/image/upload/v1657474500/instello/avatar.png";

  // Check empty fields
  if (!name || !email || !password) {
    return res.json({ error: "Please add all the fields" });
  }

  // Check email format
  const emailExtension = email.slice(-10);

  if (emailExtension !== "@gmail.com")
    return res.status(400).json({ error: "Email is invalid" });

  // Check has encoded data
  if (process.env.IS_ENCODE_USER_INFO === "true") {
    name = encrypt(name);
    email = encrypt(email);
    userImageUrl = encrypt(userImageUrl);
  }

  User.findOne({ email })
    .then((result) => {
      if (result) return res.json({ error: "Email already exist" });

      bcrypt.hash(password, 12, function (err, hash) {
        if (err) console.log(err);

        let user = new User({
          name,
          email,
          password: hash,
          bio: "",
          userImageUrl,
        });

        user.save((err, user) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ error: "Sign up is failed" });
          }

          console.log("Saved successfully");
          return res.json({ message: "Sign up successfully" });
        });
      });
    })
    .catch((err) => console.log(err));
};

module.exports.postResetPassword = async (req, res) => {
  let { email } = req.body;

  if (!email) return res.json({ error: "Please filled the field" });

  const emailExtension = email.slice(-10);

  if (emailExtension !== "@gmail.com")
    return res.json({ error: "Email is invalid" });

  if (process.env.IS_ENCODE_USER_INFO === "true") {
    email = encrypt(email);
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ error: "Email is not exist" });
  }

  const msg = {
    to: "nguyenphuonglinh11102000@gmail.com",
    from: "linhphuongnguyen11102000@gmail.com",
    subject: "Reset your password",
    html: `<strong>Here your link to reset your password: http://localhost:3000/password/reset/update/${user._id}</strong>`,
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Message sent");
    })
    .catch((error) => {
      console.log(error.response.body);
    });

  return res.json({
    message: "Thanks! Please check your email for a link to reset password",
  });
};

module.exports.postUpdatePassword = (req, res) => {
  const { password, userId } = req.body;

  if (!password) return res.json({ error: "Please filled the field" });

  bcrypt.hash(password, 12, function (err, hash) {
    if (err) console.log(err);

    User.findByIdAndUpdate({ _id: userId }, { password: hash })
      .then((result) => {
        if (!result) return res.json({ error: "Reset password is failed" });

        res.json({ message: "Reset password successfully" });
      })
      .catch((err) => console.log(err));
  });
};

module.exports.encodeAllUserData = async (_, res) => {
  if (process.env.IS_ENCODE_USER_INFO === "true") {
    await User.find({}, (err, docs) => {
      if (err) return res.status(400).json({ message: "Something went wrong" });

      docs.forEach((doc) => {
        doc.name = encrypt(doc.name);
        doc.email = encrypt(doc.email);
        doc.bio = encrypt(doc.bio);
        doc.userImageUrl = encrypt(doc.userImageUrl);

        doc.save((err) => {
          if (err) {
            return res.status(400).json({ message: "Encode data failed" });
          }
        });
      });
    });
    res.json({ message: "Encode successfully" });
  } else {
    res.json({ message: "Not permit to encode" });
  }
};

module.exports.decodeAllUserData = async (_, res) => {
  if (process.env.IS_ENCODE_USER_INFO === "true") {
    await User.find({}, (err, docs) => {
      if (err) return res.status(400).json({ message: "Something went wrong" });

      docs.forEach((doc) => {
        doc.name = decrypt(doc.name);
        doc.email = decrypt(doc.email);
        doc.bio = decrypt(doc.bio);
        doc.userImageUrl = decrypt(doc.userImageUrl);

        doc.save((err) => {
          if (err)
            return res.status(400).json({ message: "Decode data failed", doc });
        });
      });
    });
    res.json({ message: "Decode successfully" });
  } else {
    res.json({ message: "Not permit to decode" });
  }
};
