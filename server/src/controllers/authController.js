const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { isStrongPassword } = require("../utils/passwordValidator");
const { sendOTPEmail } = require("../utils/emailService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token valid for 7 days
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, role, bio, skills } = req.body;
  let profilePicture = "";
  if (req.file) {
    profilePicture = `/uploads/${req.file.filename}`;
  }

  try {
    // Validate password strength
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character." });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      bio: bio || "",
      skills: skills ? (Array.isArray(skills) ? skills : skills.split(",")) : [],
      profilePicture,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Login user - Step 1: Verify credentials and send OTP
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp, user.name);
      res.json({
        message: "OTP sent to your email",
        email: user.email,
        requiresOTP: true,
      });
    } catch (emailError) {
      // Clear OTP if email fails
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(500).json({ 
        message: "Failed to send OTP email. Please try again later." 
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Verify OTP and complete login
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and is not expired
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: "OTP not found or expired. Please login again." });
    }

    if (new Date() > user.otpExpires) {
      // Clear expired OTP
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please login again." });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // OTP is valid - clear it and generate token
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate and return token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: 'enrolledCourses',
        select: 'title _id',
      });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
