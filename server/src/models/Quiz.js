const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { // Changed from 'question' to 'text' for consistency
    type: String,
    required: true,
  },
  options: {
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true }
  },
  correctAnswer: {
    type: String, // 'A', 'B', 'C', or 'D'
    required: true,
    enum: ['A', 'B', 'C', 'D']
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  }
});

const attemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  answers: [
    {
      questionIndex: { type: Number, required: true },
      selectedAnswer: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
    },
  ],
  score: {
    type: Number, // Percentage or points
    required: true,
  },
  attemptedAt: {
    type: Date,
    default: Date.now,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    questions: [questionSchema],
    attempts: [attemptSchema],
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    timeLimit: {
      type: Number, // in minutes
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
