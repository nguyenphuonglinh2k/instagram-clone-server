require("dotenv").config();

const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const Post = require("../models/post.model");

module.exports.getUser = async (req, res) => {
  const userId = req.params.userId;
  const user = await User.findById({ _id: userId }).select("-password");
  res.json(user);
};

module.exports.getFollowers = async (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.user._id;

  try {
    const user = await User.findById({ _id: userId });
    const authUser = await User.findById({ _id: authUserId });

    const followers = user.followers || [];
    const authFollowing = authUser.following || [];

    let followerUserArr = await User.find({
      _id: { $in: followers },
    }).select("-password");

    if (authUserId !== userId) {
      const authUser = await User.findById({ _id: authUserId });
      // 1. get following of auth user
      const authFollowers = authUser.following || [];

      followerUserArr = followerUserArr.sort((firstElm, secondElm) => {
        if (String(firstElm._id.valueOf()) === authUserId) {
          return -1;
        } else if (String(secondElm._id.valueOf()) === authUserId) {
          return 1;
        } else if (
          authFollowers.includes(String(firstElm._id.valueOf())) ||
          authFollowers.includes(String(secondElm._id.valueOf()))
        ) {
          return -1;
        } else {
          return 0;
        }
      });
    }

    const updatedFollowers = followerUserArr.map((item) => {
      if (authFollowing.includes(String(item._id))) {
        return {
          _id: item._id,
          name: item.name,
          userImageUrl: item.userImageUrl,
          isFollowing: true,
        };
      } else {
        return {
          _id: item._id,
          name: item.name,
          userImageUrl: item.userImageUrl,
          isFollowing: false,
        };
      }
    });

    res.json(updatedFollowers);
  } catch (error) {
    res.status(400).json(error);
  }
};

module.exports.getFollowing = async (req, res) => {
  const userId = req.params.userId;
  const authUserId = req.user._id;

  try {
    const user = await User.findById({ _id: userId });
    const authUser = await User.findById({ _id: authUserId });

    const following = user.following || [];
    const authFollowing = authUser.following || [];

    const followingUserArr = await User.find({
      _id: { $in: following },
    }).select("-password");

    const updatedFollowing = followingUserArr.map((item) => {
      if (authFollowing.includes(String(item._id))) {
        return {
          _id: item._id,
          name: item.name,
          userImageUrl: item.userImageUrl,
          isFollowing: true,
        };
      } else {
        return {
          _id: item._id,
          name: item.name,
          userImageUrl: item.userImageUrl,
          isFollowing: false,
        };
      }
    });

    res.json(updatedFollowing);
  } catch (error) {
    res.status(400).json(error);
  }
};

module.exports.follow = async (req, res) => {
  const { userId, followId } = req.params;

  const followUser = await User.findById({ _id: followId });
  const authUser = await User.findById({ _id: userId });

  let authFollowingArr = authUser.following || [];
  let followersArr = followUser.followers || [];

  const isFollowing = authFollowingArr.some((item) => item == followId);

  if (isFollowing) {
    // 1. Delete followId from following of authUser
    authFollowingArr = authFollowingArr.reduce((arr, currentItem) => {
      if (String(currentItem._id) === followId) {
        return arr;
      } else {
        return [...arr, currentItem];
      }
    }, []);

    User.updateOne(
      { _id: authUser._id },
      {
        following: authFollowingArr,
      },
      {}
    )
      .then(() => res.json({ message: "Update successfully" }))
      .catch((err) => res.json({ error: err }));

    // 2. Delete authUser from followers of followUser
    followersArr = followersArr.reduce((arr, currentItem) => {
      if (String(currentItem._id) === userId) {
        return arr;
      } else {
        return [...arr, currentItem];
      }
    }, []);

    User.updateOne(
      { _id: followId },
      {
        followers: followersArr,
      },
      {}
    ).catch((err) => res.json({ error: err }));
  } else {
    // 1. Update and insert followId into following of authUser
    authFollowingArr.push(followId);
    User.updateOne(
      { _id: userId },
      {
        following: authFollowingArr,
      },
      {}
    )
      .then(() => res.json({ message: "Update successfully" }))
      .catch((err) => res.json({ error: err }));

    // 2. Update and insert authUser into followers of followUser
    followersArr.push(userId);
    User.updateOne(
      { _id: followId },
      {
        followers: followersArr,
      },
      {}
    ).catch((err) => res.json({ error: err }));
  }
};

module.exports.putProfile = async (req, res) => {
  const userId = req.params.userId;
  const { name, bio, imageSrc } = req.body;

  const user = await User.findById({ _id: userId }).select("-password");

  const userInfo = {
    _id: user._id,
    followers: user.followers,
    following: user.following,
    email: user.email,
    name: name || user.name,
    bio: bio || user.bio,
    userImageUrl: imageSrc || user.userImageUrl,
  };

  const posts = await Post.find();

  const updatedPostIdsArr = posts.reduce((arr, currentPost) => {
    if (String(currentPost.user._id) === userId) {
      return [...arr, String(currentPost._id)];
    } else {
      return arr;
    }
  }, []);

  User.updateOne(
    { _id: userId },
    {
      name: name || user.name,
      bio: bio || user.bio,
      userImageUrl: imageSrc || user.userImageUrl,
    },
    {},
    (err) => {
      if (err) {
        res.status(400).json(err);
      } else {
        res.json({ message: "Update successfully" });
      }
    }
  );

  Post.updateMany(
    { _id: { $in: updatedPostIdsArr } },
    {
      user: userInfo,
    },
    {},
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("update posts success");
      }
    }
  );
};

module.exports.putPassword = async (req, res) => {
  const userId = req.params.userId;
  const { oldPassword, newPassword, reEnterNewPassword } = req.body;

  if (!oldPassword || !newPassword || !reEnterNewPassword) {
    res.status(400).json({ error: "Missing some fields" });
    return;
  }

  const user = await User.findById({ _id: userId });

  bcrypt.compare(oldPassword, user.password, async function (err, result) {
    if (!result) {
      return res.status(400).json({ error: "Old password is not correct" });
    }

    if (newPassword !== reEnterNewPassword) {
      return res.status(400).json({ error: "Password is not match" });
    }

    // Hash
    bcrypt.hash(newPassword, 12, async function (err, hash) {
      if (err) {
        return res.status(400).json({ error: "Reset password failed" });
      }

      await User.updateOne(
        { _id: userId },
        {
          password: hash,
        },
        {},
        (err) => {
          if (err) {
            res.status(400).json({ error: "Reset password failed" });
          } else {
            res.json({ message: "Reset password successfully" });
          }
        }
      );
    });
  });
};

module.exports.putAvatar = async (_, res) => {
  await User.updateMany(
    {},
    {
      userImageUrl:
        "https://res.cloudinary.com/coders-tokyo/image/upload/v1657474500/instello/avatar.png",
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
