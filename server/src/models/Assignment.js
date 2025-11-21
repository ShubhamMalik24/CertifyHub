const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submission: {
    type: String, // Text or file URL
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  grade: {
    type: Number, // 0-100 only
    default: null,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ['pending', 'graded', 'resubmission_required', 'resubmitted'],
    default: 'pending'
  },
  gradedAt: {
    type: Date,
    default: null
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  isResubmission: {
    type: Boolean,
    default: false
  },
  originalSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
});

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    questions: [
      {
        question: { type: String, required: true },
        type: { type: String, enum: ["text", "file"], default: "text" },
      },
    ],
    submissions: [submissionSchema],
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // Reference to module ID
    },
    allowResubmission: {
      type: Boolean,
      default: false // Only allow resubmission if instructor explicitly enables it
    },
    maxFileSize: {
      type: Number,
      default: 10485760 // 10MB in bytes
    },
    allowedFileTypes: {
      type: [String],
      default: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png']
    },
    passingGrade: {
      type: Number,
      default: 40,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
