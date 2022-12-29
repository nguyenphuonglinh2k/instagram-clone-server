const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

router.post("/login", authController.postSignIn);

router.post("/signup", authController.postSignUp);

router.post("/confirmOtp", authController.confirmOtp);

router.post("/password/reset", authController.postResetPassword);

router.post("/password/reset/update", authController.postUpdatePassword);

// Support
router.post("/encodeAllUserData", authController.encodeAllUserData);

router.post("/decodeAllUserData", authController.decodeAllUserData);

module.exports = router;
