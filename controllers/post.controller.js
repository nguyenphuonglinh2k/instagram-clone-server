const Post = require("../models/post.model");
const Like = require("../models/like.model");
const Comment = require("../models/comment.model");
const User = require("../models/user.model");
const { decryptOneUserData } = require("./helpers");

module.exports.getAllPosts = async (_, res) => {
  try {
    const allPost = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(allPost);
  } catch (error) {
    console.log("error", error);
  }
};

module.exports.getMyPosts = async (req, res) => {
  const userId = req.params.userId;

  try {
    let posts = await Post.find().lean();

    // // Check has encoded data
    // if (process.env.IS_ENCODE_USER_INFO === "true") {
    //   posts = posts.map((post) => ({
    //     ...post,
    //     user: decryptOneUserData(post.user),
    //   }));
    // }

    const filteredPosts = posts.filter((post) => {
      return String(post.user._id.valueOf()) === userId;
    });

    res.status(200).json(filteredPosts);
  } catch (error) {
    res.status(400).json(error);
  }
};

module.exports.getAllLikes = async (_, res) => {
  const allLike = await Like.find();
  res.status(200).json(allLike);
};

module.exports.getMyLikes = async (req, res) => {
  const userId = req.params.userId;

  try {
    const allLike = await Like.find({ userId });

    res.status(200).json(allLike);
  } catch (error) {
    res.status(400).json({ error });
  }
};

module.exports.getAllComments = async (_, res) => {
  let allComment = await Comment.find();

  // Check has encoded data
  // if (process.env.IS_ENCODE_USER_INFO === "true") {
  //   allComment = allComment.map((comment) => ({
  //     ...comment,
  //     user: decryptOneUserData(comment.user),
  //   }));
  // }

  res.status(200).json(allComment);
};

module.exports.getAllCommentOfPost = async (req, res) => {
  const postId = req.params.postId;

  try {
    let allComment = await Comment.find({ postId });

    // Check has encoded data
    // if (process.env.IS_ENCODE_USER_INFO === "true") {
    //   allComment = {
    //     ...allComment,
    //     user: decryptOneUserData(comment.user),
    //   };
    // }

    res.status(200).json(allComment);
  } catch (error) {
    res.status(400).json({ error });
  }
};

module.exports.postCreateMyPost = async (req, res) => {
  const { imageUrl, caption } = req.body;
  const userId = req.params.userId;

  if (!imageUrl || !caption) {
    return res.json({ error: "Please filled the field" });
  }

  let user = await User.findById({ _id: userId }).select("-password").lean();

  // Check has encoded data
  if (process.env.IS_ENCODE_USER_INFO === "true") {
    user = decryptOneUserData(user);
  }

  const date = new Date();

  const newPost = new Post({
    caption,
    imageUrl,
    user,
    createdAt: date,
  });

  newPost.save((err, newPost) => {
    if (err) {
      console.log(err);
      return res.json({ error: "Create post is failed" });
    }

    console.log("Saved successfully");
    return res.status(201).json({ message: "Created post successfully" });
  });
};

module.exports.postActionLike = async (req, res) => {
  const userId = req.params.userId;
  const { postId } = req.body;

  const actionLike = await Like.findOne({ postId: postId, userId });

  if (!actionLike) {
    const newActionLike = new Like({
      postId,
      userId,
      isLiked: true,
    });

    newActionLike.save(async (err, newActionLike) => {
      if (err) {
        console.log(err);
      }
    });

    let likes = await Like.find();
    likes.push(newActionLike);

    return res.json(likes);
  }

  Like.findOneAndDelete({ postId, userId }).then((result) => {});

  try {
    let likes = await Like.find();
    return res.status(200).json(likes);
  } catch (error) {
    return res.status(400).json({ error });
  }
};

module.exports.postComment = async (req, res) => {
  const { postId, userId } = req.params;
  const { caption } = req.body;

  try {
    let user = await User.findById({ _id: userId }).select("-password").lean();

    // Check has encoded data
    if (process.env.IS_ENCODE_USER_INFO === "true") {
      user = decryptOneUserData(user);
    }

    const createdAt = new Date();

    const comment = new Comment({
      caption,
      postId,
      user,
      createdAt,
    });

    comment.save(async (err, comment) => {
      if (err) {
        console.log(err);
      }

      let comments = await Comment.find();

      res.status(200).json(comments);
    });
  } catch (error) {
    res.status(400).json(error);
  }
};
