const express = require("express");
const router = express.Router();

const middleware = require("../middleware/requireLogin.middleware");
const postController = require("../controllers/post.controller");

router.get("/posts", middleware.requiredLogin, postController.getAllPosts);

router.get(
  "/comments",
  middleware.requiredLogin,
  postController.getAllComments
);

router.get("/likes", middleware.requiredLogin, postController.getAllLikes);

router.post(
  "/post/create",
  middleware.requiredLogin,
  postController.postCreateMyPost
);

router.post(
  "/post/action",
  middleware.requiredLogin,
  postController.postActionLike
);

router.post(
  "/post/comment",
  middleware.requiredLogin,
  postController.postComment
);

module.exports = router;
