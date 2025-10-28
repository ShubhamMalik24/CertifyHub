const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const { sendSuccess, sendSuccessList, sendError, sendNotFound, sendForbidden, sendConflict, sendValidationError } = require("../utils/apiResponse");

// @desc    Create a new assignment for a module
// @route   POST /api/assignments
// @access  Private (Instructor only)
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, questions, courseId, moduleId } = req.body;

    // Verify instructor owns the course
    const course = await Course.findById(courseId);
    if (!course) {
      return sendNotFound(res, "Course not found");
    }
    if (course.instructor.toString() !== req.user._id.toString()) {
      return sendForbidden(res, "Not authorized to create assignment for this course");
    }

    const assignment = new Assignment({
      title,
      description,
      dueDate,
      questions,
      course: courseId,
      module: moduleId,
    });

    const savedAssignment = await assignment.save();

    // Add to course module
    const module = course.modules.id(moduleId);
    if (module) {
      module.assignments.push(savedAssignment._id);
      await course.save();
    }

    return sendSuccess(res, savedAssignment, "Assignment created successfully", 201);
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Get assignments for a course
// @route   GET /api/assignments/:courseId
// @access  Private
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId });
    const isInstructor = req.user.role === 'instructor' || req.user.role === 'admin';
    if (isInstructor) {
      await Assignment.populate(assignments, { path: "submissions.student", select: "name email" });
    } else {
      // For students, add hasSubmitted
      assignments.forEach(assignment => {
        assignment.hasSubmitted = assignment.submissions.some(sub => sub.student.toString() === req.user._id.toString());
      });
    }
    return sendSuccessList(res, assignments, {}, "Assignments retrieved successfully");
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
  try {
    let submission = req.body.submission;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) return sendNotFound(res, "Assignment not found");

    // If file was uploaded, use the file path as submission
    if (req.file) {
      submission = `/uploads/${req.file.filename}`;

      // Validate file against assignment constraints
      // Check file size against assignment limits
      if (assignment.maxFileSize && req.file.size > assignment.maxFileSize) {
        return res.status(400).json({
          message: `File too large. Maximum allowed size is ${Math.round(assignment.maxFileSize / (1024 * 1024))}MB.`
        });
      }

      // Check file type against assignment allowed types
      if (assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        if (!assignment.allowedFileTypes.includes(fileExt)) {
          return res.status(400).json({
            message: `File type not allowed. Allowed types: ${assignment.allowedFileTypes.join(', ')}`
          });
        }
      }
    }

    if (!submission) {
      return res.status(400).json({ message: "Submission content or file is required" });
    }

    // Check submission rules
    const existingSubmissions = assignment.submissions.filter(sub => sub.student.toString() === req.user._id.toString());
    
    if (existingSubmissions.length > 0) {
      const latestSubmission = existingSubmissions[existingSubmissions.length - 1];
      
      // Check if already has a non-resubmission submission
      const regularSubmission = existingSubmissions.find(sub => !sub.isResubmission);
      if (regularSubmission && !latestSubmission.isResubmission) {
        // Check if resubmission is allowed due to low grade
        if (latestSubmission.status === 'resubmission_required') {
          // Allow resubmission - continue with submission logic
        } else if (assignment.allowResubmission) {
          // Allow resubmission if explicitly enabled by instructor
        } else {
          return sendConflict(res, "Assignment has already been submitted. Only one submission is allowed unless resubmission is required.");
        }
      }
      
      // Check resubmission window (7 days from grading date)
      if (latestSubmission.status === 'resubmission_required' && latestSubmission.gradedAt) {
        const resubmissionDeadline = new Date(latestSubmission.gradedAt);
        resubmissionDeadline.setDate(resubmissionDeadline.getDate() + 7);
        
        if (new Date() > resubmissionDeadline) {
          return sendConflict(res, "Resubmission window has expired. Resubmissions are only allowed within 7 days of grading.");
        }
      }
    }

    // Determine if this is a resubmission
    const isResubmission = existingSubmissions.length > 0;
    const originalSubmissionId = isResubmission ? existingSubmissions[0]._id : null;
    
    assignment.submissions.push({
      student: req.user._id,
      submission,
      submittedAt: new Date(),
      status: 'pending',
      isResubmission,
      originalSubmissionId
    });

    await assignment.save();
    
    // Update user progress
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (user && user.progress) {
      const courseProgress = user.progress.get(assignment.course.toString()) || { completedModules: [], completedLessons: [], grades: {}, scores: {} };
      if (!courseProgress.grades) courseProgress.grades = {};
      courseProgress.grades[assignment._id.toString()] = 0; // Pending grade
      user.progress.set(assignment.course.toString(), courseProgress);
      await user.save();
    }
    
    return sendSuccess(res, {
      message: isResubmission ? "Resubmitted successfully" : "Submitted successfully",
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      isResubmission,
      submittedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Grade a submission
// @route   PUT /api/assignments/:id/grade/:studentId
// @access  Private (Instructor)
exports.gradeAssignment = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    
    // Strict grade validation (0-100 only)
    if (grade === undefined || grade === null) {
      return sendValidationError(res, ["Grade is required"], "Validation failed");
    }
    
    const numericGrade = parseInt(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      return sendValidationError(res, ["Grade must be a number between 0 and 100"], "Invalid grade");
    }
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return sendNotFound(res, "Assignment not found");

    // Verify instructor authorization
    const course = await Course.findById(assignment.course);
    if (!course) {
      return sendNotFound(res, "Course not found");
    }
    if (course.instructor.toString() !== req.user._id.toString()) {
      return sendForbidden(res, "Not authorized to grade assignments for this course");
    }

    const submission = assignment.submissions.find(sub => sub.student.toString() === req.params.studentId);
    if (!submission) return sendNotFound(res, "Submission not found");

    // Update submission with grade and feedback
    submission.grade = numericGrade;
    submission.feedback = feedback || "";
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;
    
    // Determine submission status based on grade
    const passingGrade = assignment.passingGrade || 40;
    if (numericGrade < passingGrade) {
      submission.status = 'resubmission_required';
    } else {
      submission.status = 'graded';
    }

    await assignment.save();
    
    // Create notification for resubmission if grade < passing threshold
    let resubmissionInfo = null;
    if (numericGrade < passingGrade) {
      const resubmissionDeadline = new Date();
      resubmissionDeadline.setDate(resubmissionDeadline.getDate() + 7);
      
      resubmissionInfo = {
        required: true,
        deadline: resubmissionDeadline.toISOString(),
        reason: `Grade of ${numericGrade}% is below the passing threshold of ${passingGrade}%`
      };
      
      // TODO: Create in-app notification for student
      console.log(`Resubmission required for student ${req.params.studentId} on assignment ${assignment._id}`);
    }
    
    // Update user progress with the grade
    const User = require('../models/User');
    const user = await User.findById(req.params.studentId);
    if (user && user.progress) {
      const courseProgress = user.progress.get(assignment.course.toString()) || { completedModules: [], completedLessons: [], grades: {}, scores: {} };
      if (!courseProgress.grades) courseProgress.grades = {};
      courseProgress.grades[assignment._id.toString()] = grade;
      user.progress.set(assignment.course.toString(), courseProgress);
      await user.save();
    }
    
    return sendSuccess(res, {
      grade: numericGrade,
      status: submission.status,
      gradedAt: submission.gradedAt.toISOString(),
      resubmissionRequired: numericGrade < passingGrade,
      resubmissionInfo,
      passingGrade
    }, "Assignment graded successfully");
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Instructor)
exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("submissions.student", "name email");

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Verify instructor or admin
    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({ submissions: assignment.submissions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get my submission for an assignment
// @route   GET /api/assignments/:id/my-submission
// @access  Private (Student)
exports.getMySubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const submission = assignment.submissions.find(sub => sub.student.toString() === req.user._id.toString());
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    res.json({ submission });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Instructor)
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Verify instructor
    const course = await Course.findById(assignment.course);
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Remove from course module
    const module = course.modules.id(assignment.module);
    if (module) {
      module.assignments = module.assignments.filter(a => a.toString() !== assignment._id.toString());
      await course.save();
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
