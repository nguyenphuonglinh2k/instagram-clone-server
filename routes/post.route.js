const express = require("express");
const router = express.Router();

const middleware = require("../middleware/requireLogin.middleware");
const postController = require("../controllers/post.controller");

router.get("/posts", postController.getAllPosts);

router.get(
  "/posts/:userId",
  middleware.requiredLogin,
  postController.getMyPosts
);

router.get(
  "/comments",
  middleware.requiredLogin,
  postController.getAllComments
);

router.get(
  "/post/:postId/comments",
  middleware.requiredLogin,
  postController.getAllCommentOfPost
);

router.get("/likes", middleware.requiredLogin, postController.getAllLikes);

router.get(
  "/likes/:userId",
  middleware.requiredLogin,
  postController.getMyLikes
);

router.post(
  "/post/create",
  middleware.requiredLogin,
  postController.postCreateMyPost
);

router.post(
  "/post/like/:userId",
  middleware.requiredLogin,
  postController.postActionLike
);

router.post(
  "/post/:postId/comment/:userId",
  middleware.requiredLogin,
  postController.postComment
);

module.exports = router;
