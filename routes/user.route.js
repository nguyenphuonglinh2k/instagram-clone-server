const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const middleware = require("../middleware/requireLogin.middleware");

router.get("/", (req, res) => {
  res.send("hello");
});

router.get("/users/:userId", userController.getUser);

router.put("/follow", middleware.requiredLogin, userController.follow);

module.exports = router;
