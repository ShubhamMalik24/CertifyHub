const express = require("express");
const { registerUser, loginUser, getMe } = require("../controllers/authController");
const { upload } = require("../utils/upload");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", upload.single("profilePicture"), registerUser);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post("/login", loginUser);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", protect, getMe);

module.exports = router;
