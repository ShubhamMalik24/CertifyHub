const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuiz,
  submitQuiz,
  generateQuiz,
} = require("../controllers/quizController");
const { protect } = require("../middleware/auth");

router.route("/").post(protect, createQuiz);
router.route("/generate").post(protect, generateQuiz);
router.route("/:courseId").get(protect, getQuizzes);
router.route("/single/:id").get(protect, getQuiz);
router.route("/:id/submit").post(protect, submitQuiz);

module.exports = router;
