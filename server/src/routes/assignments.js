const express = require("express");
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  submitAssignment,
  getSubmissions,
  gradeAssignment,
  deleteAssignment,
  getMySubmission,
} = require("../controllers/assignmentController");
const { protect } = require("../middleware/auth");
const { uploadAssignment } = require("../utils/upload");

router.route("/").post(protect, createAssignment);
router.route("/:courseId").get(protect, getAssignments);
router.route("/:id/submit").post(protect, uploadAssignment, submitAssignment);
router.route("/:id/submissions").get(protect, getSubmissions);
router.route("/:id/my-submission").get(protect, getMySubmission);
router.route("/:id/grade/:studentId").put(protect, gradeAssignment);
router.route("/:id").delete(protect, deleteAssignment);

module.exports = router;
