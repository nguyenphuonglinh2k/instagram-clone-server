require("dotenv").config();

const User = require("../models/user.model");

module.exports.getUser = async (req, res) => {
  const userId = req.params.userId;
  const user = await User.findById({ _id: userId }).select("-password");
  res.json(user);
};

module.exports.follow = async (req, res) => {
  const { followId } = req.body;
  const user = req.user;

  let userExist = await User.findById({ _id: user._id });

  let isExisted = userExist.following.find((item) => item == followId);

  if (!isExisted) {
    User.findByIdAndUpdate(
      { _id: followId },
      {
        $push: { followers: user._id },
      },
      {
        new: true,
      }
    )
      .select("-password")
      .then((result) => res.json(result))
      .catch((err) => res.json({ error: err }));

    User.findByIdAndUpdate(
      { _id: user._id },
      {
        $push: { following: followId },
      },
      {
        new: true,
      },
      (err, result) => {
        if (err) {
          return res.json({ error: err });
        }
      }
    );
  }
};
