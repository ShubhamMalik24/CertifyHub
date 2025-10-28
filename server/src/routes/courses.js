const express = require("express");
const {
  createCourse,
  getCourses,
  getCourseById,
  enrollCourse,
  addReview,
  getCourseContent,
  completeModule,
  addModule,
  deleteModule,
  uploadModuleFiles,
  getCourseProgress,
  incompleteModule,
  addLesson,
  deleteLesson,
  uploadLessonFile,
  rateCourse,
  getCourseRatings,
  checkCourseCompletion,
} = require("../controllers/courseController");
const {
  createAssignment,
  getAssignments,
} = require("../controllers/assignmentController");
const {
  createQuiz,
  getQuizzes,
} = require("../controllers/quizController");
const {
  generateCertificate,
} = require("../controllers/certificateController");
const { protect } = require("../middleware/auth");
const { upload, uploadFields } = require("../utils/upload");

const router = express.Router();

// @route   POST /api/courses
// @desc    Create new course (Instructor only)
// @access  Private
router.post("/", protect, createCourse);

// @route   GET /api/courses
// @desc    Get all courses (with filters & search)
// @access  Public
router.get("/", getCourses);

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get("/:id", getCourseById);

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post("/:id/enroll", protect, enrollCourse);

// @route   POST /api/courses/:id/reviews
// @desc    Add a review to a course
// @access  Private
router.post("/:id/reviews", protect, addReview);

// @route   GET /api/courses/:id/content
// @desc    Get course content and user progress
// @access  Private (enrolled students)
router.get("/:id/content", protect, getCourseContent);

// @route   POST /api/courses/:id/modules/:moduleId/complete
// @desc    Mark module as completed for user
// @access  Private (enrolled students)
router.post("/:id/modules/:moduleId/complete", protect, completeModule);

// @route   POST /api/courses/:id/modules/:moduleId/incomplete
// @desc    Mark module as incomplete for user
// @access  Private (enrolled students)
router.post("/:id/modules/:moduleId/incomplete", protect, incompleteModule);

// @route   POST /api/courses/:id/modules
// @desc    Add a module to a course (Instructor only)
// @access  Private
router.post("/:id/modules", protect, addModule);

// @route   DELETE /api/courses/:id/modules/:moduleId
// @desc    Delete a module from a course (Instructor only)
// @access  Private
router.delete("/:id/modules/:moduleId", protect, deleteModule);

// @route   POST /api/courses/:id/modules/:moduleId/upload
// @desc    Upload PPT/PDF to a module (Instructor only)
// @access  Private
router.post(
  "/:id/modules/:moduleId/upload",
  protect,
  uploadFields([{ name: "ppt" }, { name: "pdf" }]),
  uploadModuleFiles
);

// @route   GET /api/courses/:id/progress
// @desc    Get enrolled students and their progress for a course (Instructor only)
// @access  Private
router.get("/:id/progress", protect, getCourseProgress);

// @route   POST /api/courses/:id/modules/:moduleId/lessons
// @desc    Add a lesson to a module (Instructor only)
// @access  Private
router.post("/:id/modules/:moduleId/lessons", protect, addLesson);

// @route   DELETE /api/courses/:id/modules/:moduleId/lessons/:lessonId
// @desc    Delete a lesson from a module (Instructor only)
// @access  Private
router.delete("/:id/modules/:moduleId/lessons/:lessonId", protect, deleteLesson);

// @route   POST /api/courses/:id/modules/:moduleId/lessons/:lessonId/upload
// @desc    Upload a file for a lesson (Instructor only)
// @access  Private
router.post(
  "/:id/modules/:moduleId/lessons/:lessonId/upload",
  protect,
  upload.single("file"),
  uploadLessonFile
);

// @route   POST /api/courses/:id/modules/:moduleId/assignments
// @desc    Create assignment for a module (Instructor only)
// @access  Private
router.post("/:id/modules/:moduleId/assignments", protect, createAssignment);

// @route   GET /api/courses/:id/assignments
// @desc    Get assignments for a course
// @access  Private
router.get("/:id/assignments", protect, getAssignments);

// @route   POST /api/courses/:id/modules/:moduleId/quizzes
// @desc    Create quiz for a module (Instructor only)
// @access  Private
router.post("/:id/modules/:moduleId/quizzes", protect, createQuiz);

// @route   GET /api/courses/:id/quizzes
// @desc    Get quizzes for a course
// @access  Private
router.get("/:id/quizzes", protect, getQuizzes);

// @route   POST /api/courses/:id/rate
// @desc    Rate a course (1-5 stars)
// @access  Private (enrolled students)
router.post("/:id/rate", protect, rateCourse);

// @route   GET /api/courses/:id/ratings
// @desc    Get ratings for a course
// @access  Public
router.get("/:id/ratings", getCourseRatings);

// @route   POST /api/courses/:id/check-completion
// @desc    Check course completion and generate certificate if eligible
// @access  Private
router.post("/:id/check-completion", protect, checkCourseCompletion);

// @route   POST /api/courses/:id/certificate
// @desc    Generate certificate for course completion
// @access  Private
router.post("/:id/certificate", protect, generateCertificate);

module.exports = router;
