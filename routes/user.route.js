const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const middleware = require("../middleware/requireLogin.middleware");

router.get("/", (req, res) => {
  res.send("hello");
});

router.get("/users/:userId", userController.getUser);

router.get(
  "/users/:userId/followers",
  middleware.requiredLogin,
  userController.getFollowers
);

router.get(
  "/users/:userId/following",
  middleware.requiredLogin,
  userController.getFollowing
);

router.put("/follow", middleware.requiredLogin, userController.follow);

router.put(
  "/users/:userId/profile",
  middleware.requiredLogin,
  userController.putProfile
);

module.exports = router;
