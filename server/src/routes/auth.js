const express = require("express");
const { registerUser, loginUser, getMe, verifyOTP } = require("../controllers/authController");
const { upload } = require("../utils/upload");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", upload.single("profilePicture"), registerUser);

// @route   POST /api/auth/login
// @desc    Login user & send OTP
// @access  Public
router.post("/login", loginUser);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete login
// @access  Public
router.post("/verify-otp", verifyOTP);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", protect, getMe);

module.exports = router;
