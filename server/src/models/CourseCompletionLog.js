const mongoose = require("mongoose");

const courseCompletionLogSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["marked_complete", "marked_incomplete"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    eligibleStudents: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        eligible: Boolean,
        reason: String,
        certificateGenerated: {
          type: Boolean,
          default: false,
        },
        certificateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Certificate",
          default: null,
        },
      },
    ],
    metadata: {
      totalEnrolledStudents: Number,
      eligibleStudentsCount: Number,
      certificatesGenerated: Number,
    },
  },
  { timestamps: true }
);

// Add indexes for efficient querying
courseCompletionLogSchema.index({ course: 1, timestamp: -1 });
courseCompletionLogSchema.index({ instructor: 1, timestamp: -1 });

module.exports = mongoose.model("CourseCompletionLog", courseCompletionLogSchema);