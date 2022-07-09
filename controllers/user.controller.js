require("dotenv").config();

const User = require("../models/user.model");

module.exports.getUser = async (req, res) => {
  const userId = req.params.userId;
  const user = await User.findById({ _id: userId }).select("-password");
  res.json(user);
};

module.exports.getFollowers = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById({ _id: userId });
    const followers = user.followers || [];

    const followerUserArr = await User.find({ _id: { $in: followers } }).select(
      "-password"
    );

    res.json(followerUserArr);
  } catch (error) {
    res.status(400).json(error);
  }
};

module.exports.getFollowing = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById({ _id: userId });
    const following = user.following || [];

    const followingUserArr = await User.find({
      _id: { $in: following },
    }).select("-password");

    res.json(followingUserArr);
  } catch (error) {
    res.status(400).json(error);
  }
};

module.exports.follow = async (req, res) => {
  const { followId } = req.body;
  const user = req.user;

  let userExist = await User.findById({ _id: user._id });

  let isExisted = userExist.following.find((item) => item == followId);

  if (!isExisted) {
    User.updateOne(
      { _id: followId },
      {
        followers: user._id,
      },
      {}
    )
      .select("-password")
      .then((result) => res.json(result))
      .catch((err) => res.status(400).json({ error: err }));

    User.updateOne(
      { _id: user._id },
      {
        following: followId,
      },
      {},
      (err) => {
        if (err) {
          return res.status(400).json({ error: err });
        }
      }
    );
  }
};

module.exports.putProfile = async (req, res) => {
  const userId = req.params.userId;
  const { name, bio, imageSrc } = req.body;

  const user = await User.findById({ _id: userId });

  await User.updateOne(
    { _id: userId },
    {
      name: name || user.name,
      bio: bio || user.bio,
      userImageUrl: imageSrc || user.userImageUrl,
    },
    {},
    (err) => {
      if (err) {
        return res.status(400).json(err);
      } else {
        res.json({ message: "Update successfully" });
      }
    }
  );
};
