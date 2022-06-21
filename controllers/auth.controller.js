require("dotenv").config();

const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");
var jwt = require("jsonwebtoken");

const User = require("../models/user.model");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.postSignIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ error: "Please add all the fields" });
  }

  const emailExtension = email.slice(-10);

  if (emailExtension !== "@gmail.com")
    return res.json({ error: "Email is invalid" });

  let user = await User.findOne({ email: email });

  if (!user) return res.json({ error: "Email is not exist" });

  bcrypt.compare(password, user.password, function (err, result) {
    if (!result) return res.json({ error: "Password is wrong" });

    const token = jwt.sign(
      {
        user: user,
      },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    const { _id, email, name, userImageUrl, followers, following } = user;

    return res.json({
      token: token,
      user: { _id, email, name, userImageUrl, followers, following },
    });
  });
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
        return res.json({ error: "Email is invalid" });

      bcrypt.hash(password, 12, function (err, hash) {
        if (err) console.log(err);

        let user = new User({
          name,
          email,
          password: hash,
          userImageUrl:
            "https://cdn.glitch.com/9b1d0fdf-246e-4fdd-9575-5734520b815a%2Fundraw_female_avatar_w3jk.svg?v=1591767462454",
        });

        user.save((err, user) => {
          if (err) {
            console.log(err);
            return res.json({ error: "Sign up is failed" });
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

  console.log("userId: ", userId);

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
