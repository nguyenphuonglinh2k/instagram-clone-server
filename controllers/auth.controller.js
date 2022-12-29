require("dotenv").config();

const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
var jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const Session = require("../models/session.model");

const { generateOTP, sendOTPEmail, encrypt, decrypt } = require("./helpers");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.postSignIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please add all the fields" });
  }

  const emailExtension = email.slice(-10);

  if (emailExtension !== "@gmail.com")
    return res.status(400).json({ error: "Email is invalid" });

  const user = await User.findOne({ email }).lean();

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
  const { otp, email } = req.body;

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
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ error: "Please add all the fields" });
  }

  User.findOne({ email: email })
    .then((result) => {
      if (result) return res.json({ error: "Email already exist" });

      const emailExtension = email.slice(-10);

      if (emailExtension !== "@gmail.com")
        return res.status(400).json({ error: "Email is invalid" });

      bcrypt.hash(password, 12, function (err, hash) {
        if (err) console.log(err);

        let user = new User({
          name,
          email,
          password: hash,
          bio: "",
          userImageUrl:
            "https://res.cloudinary.com/coders-tokyo/image/upload/v1657474500/instello/avatar.png",
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
  const { email } = req.body;

  if (!email) return res.json({ error: "Please filled the field" });

  const user = await User.findOne({ email: email });

  const emailExtension = email.slice(-10);

  if (emailExtension !== "@gmail.com")
    return res.json({ error: "Email is invalid" });

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

module.exports.encodeAllUserData = (_, res) => {
  User.find({}, (err, docs) => {
    if (err) return res.status(400).json({ message: "Something went wrong" });

    docs.forEach((doc) => {
      doc.name = encrypt(doc.name);

      doc.save((err) => {
        if (err) {
          return res.status(400).json({ message: "Encode data failed" });
        }
      });
    });
  });
  res.json({ message: "Encode successfully" });
};

module.exports.decodeAllUserData = (_, res) => {
  User.find({}, (err, docs) => {
    if (err) return res.status(400).json({ message: "Something went wrong" });

    docs.forEach((doc) => {
      doc.name = decrypt(doc.name);

      doc.save((err) => {
        if (err)
          return res.status(400).json({ message: "Decode data failed", doc });
      });
    });
  });
  res.json({ message: "Decode successfully" });
};
