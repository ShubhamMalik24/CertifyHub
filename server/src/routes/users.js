const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  getStudentDashboard,
  getInstructorDashboard,
  getAdminDashboard,
  getAllUsers,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile (bio, skills)
// @access  Private
router.put("/profile", protect, updateUserProfile);

// @route   POST /api/users/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post("/profile-picture", protect, uploadProfilePicture);

// @route   GET /api/users/dashboard/student
// @desc    Get student dashboard data
// @access  Private (Student)
router.get("/dashboard/student", protect, getStudentDashboard);

// @route   GET /api/users/dashboard/instructor
// @desc    Get instructor dashboard data
// @access  Private (Instructor)
router.get("/dashboard/instructor", protect, getInstructorDashboard);

// @route   GET /api/users/dashboard/admin
// @desc    Get admin dashboard data
// @access  Private (Admin)
router.get("/dashboard/admin", protect, authorize("admin"), getAdminDashboard);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get("/", protect, authorize("admin"), getAllUsers);

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put("/:id/role", protect, authorize("admin"), updateUserRole);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
