const Post = require("../models/post.model");
const Like = require("../models/like.model");
const Comment = require("../models/comment.model");

module.exports.getAllPosts = async (req, res) => {
  const allPost = await Post.find();
  res.json(allPost);
};

module.exports.getAllLikes = async (req, res) => {
  const allLike = await Like.find();
  res.json(allLike);
};

module.exports.getAllComments = async (req, res) => {
  const allComment = await Comment.find();
  res.json(allComment);
};

module.exports.postCreateMyPost = async (req, res) => {
  const { imageUrl, caption } = req.body;
  const user = req.user;

  if (!imageUrl || !caption)
    return res.json({ error: "Please filled the field" });

  const newPost = new Post({
    caption,
    imageUrl,
    user: user,
  });

  newPost.save((err, newPost) => {
    if (err) {
      console.log(err);
      return res.json({ error: "Create post is failed" });
    }

    console.log("Saved successfully");
    return res.json({ message: "Created post successfully" });
  });
};

module.exports.postActionLike = async (req, res) => {
  const user = req.user;
  const { postId } = req.body;

  const actionLike = await Like.findOne({ postId: postId, userId: user._id });

  if (!actionLike) {
    const newActionLike = new Like({
      postId,
      userId: user._id,
      isLiked: true,
    });

    newActionLike.save(async (err, newActionLike) => {
      if (err) {
        console.log(err);
      }
    });

    let likes = await Like.find();
    likes.push(newActionLike);
    console.log(likes);

    return res.json(likes);
  }

  Like.findOneAndDelete({ postId: postId, userId: user._id }).then(
    (result) => {}
  );

  let likes = await Like.find();
  console.log(likes);

  return res.json(likes);
};

module.exports.postComment = async (req, res) => {
  const user = req.user;
  const { postId, caption } = req.body;

  const comment = new Comment({
    caption,
    postId,
    user: user,
  });

  comment.save(async (err, comment) => {
    if (err) {
      console.log(err);
    }

    let comments = await Comment.find();

    res.json(comments);
  });
};
