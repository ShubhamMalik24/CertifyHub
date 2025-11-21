const Certificate = require("../models/Certificate");
const Course = require("../models/Course");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Quiz = require("../models/Quiz");
const CourseCompletionLog = require("../models/CourseCompletionLog");
const pdfGenerator = require("../utils/pdfGenerator");
const { sendSuccess, sendSuccessList, sendError, sendNotFound, sendForbidden, sendConflict, sendValidationError } = require("../utils/apiResponse");
const fs = require('fs');
const path = require('path');

// @desc    Generate certificate for a student
// @route   POST /api/certificates/generate
// @access  Private (Instructor)
exports.generateCertificate = async (req, res) => {
  try {
    const { studentId, courseId, grade } = req.body;

    // Verify instructor owns the course
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ student: studentId, course: courseId });
    if (existingCert) {
      return res.status(400).json({ message: "Certificate already generated" });
    }

    // Generate unique certificate ID
    const certificateId = 'CERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Generate PDF certificate (returns file path)
    const student = await User.findById(studentId);
    const instructor = await User.findById(course.instructor);
    const certificateUrl = await pdfGenerator.generateCertificate({
      studentName: student.name,
      courseTitle: course.title,
      completionDate: new Date(),
      instructorName: instructor.name,
      certificateId: certificateId,
      grade: grade || 'Pass',
      overallScore: null,
    });

    const certificate = new Certificate({
      student: studentId,
      course: courseId,
      grade,
      certificateUrl,
      certificateId: certificateId,
      issuedBy: req.user._id,
    });

    await certificate.save();

    res.status(201).json({ message: "Certificate generated", certificate });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get certificates for a student
// @route   GET /api/certificates/student/:studentId
// @access  Private
exports.getCertificatesForStudent = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.studentId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    const certificates = await Certificate.find({ student: req.params.studentId }).populate("course").populate("student", "name email");
    res.json(certificates);
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Mark course as completed by instructor (triggers certificate generation)
// @route   POST /api/admin/courses/:courseId/mark-complete
// @access  Private (Instructor only)
exports.markCourseComplete = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    const course = await Course.findById(courseId)
      .populate('enrolledStudents', 'name email progress')
      .populate('modules.assignments')
      .populate('modules.quizzes');

    if (!course) {
      return sendNotFound(res, "Course not found");
    }

    // Verify instructor authorization
    if (course.instructor.toString() !== req.user._id.toString()) {
      return sendForbidden(res, "Not authorized to mark this course as complete");
    }

    if (course.isCompletedByInstructor) {
      return sendConflict(res, "Course has already been marked as complete");
    }

    // Evaluate each enrolled student for certificate eligibility
    const eligibleStudents = [];
    let certificatesGenerated = 0;

    for (const student of course.enrolledStudents) {
      const eligibilityResult = await checkStudentEligibility(student, course, true);
      
      if (eligibilityResult.eligible) {
        try {
          // Generate certificate
          const instructor = await User.findById(course.instructor);
          const certificateId = 'CERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
          const certificateUrl = await pdfGenerator.generateCertificate({
            studentName: student.name,
            courseTitle: course.title,
            completionDate: new Date(),
            instructorName: instructor.name,
            certificateId: certificateId,
            grade: eligibilityResult.grade || 'Pass',
            overallScore: eligibilityResult.overallScore || null,
          });

          const certificate = new Certificate({
            student: student._id,
            course: course._id,
            certificateUrl,
            certificateId: certificateId,
            grade: eligibilityResult.grade,
            overallScore: eligibilityResult.overallScore,
            issuedBy: req.user._id,
            verificationUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${certificateId}`
          });

          await certificate.save();
          
          eligibleStudents.push({
            student: student._id,
            eligible: true,
            reason: eligibilityResult.reason,
            certificateGenerated: true,
            certificateId: certificate._id
          });
          
          certificatesGenerated++;
        } catch (certError) {
          console.error('Failed to generate certificate for student:', student._id, certError);
          eligibleStudents.push({
            student: student._id,
            eligible: true,
            reason: eligibilityResult.reason,
            certificateGenerated: false,
            certificateId: null
          });
        }
      } else {
        eligibleStudents.push({
          student: student._id,
          eligible: false,
          reason: eligibilityResult.reason,
          certificateGenerated: false,
          certificateId: null
        });
      }
    }

    // Mark course as completed
    course.isCompletedByInstructor = true;
    course.completedAt = new Date();
    course.completedBy = req.user._id;
    await course.save();

    // Create audit log
    const completionLog = new CourseCompletionLog({
      course: course._id,
      instructor: req.user._id,
      action: 'marked_complete',
      eligibleStudents,
      metadata: {
        totalEnrolledStudents: course.enrolledStudents.length,
        eligibleStudentsCount: eligibleStudents.filter(s => s.eligible).length,
        certificatesGenerated
      }
    });
    
    await completionLog.save();

    return sendSuccess(res, {
      courseId: course._id,
      completedAt: course.completedAt.toISOString(),
      totalStudents: course.enrolledStudents.length,
      eligibleStudents: eligibleStudents.filter(s => s.eligible).length,
      certificatesGenerated,
      logId: completionLog._id
    }, "Course marked as complete and eligible certificates generated");

  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// Helper function to check if student is eligible for certificate
const checkStudentEligibility = async (student, course, isMarkingComplete = false) => {
  try {
    // Check if student is enrolled
    if (!course.enrolledStudents.some(s => s._id.toString() === student._id.toString())) {
      return {
        eligible: false,
        reason: 'Student is not enrolled in this course'
      };
    }

    // Skip course completion check if we're in the process of marking it complete
    if (!isMarkingComplete && !course.isCompletedByInstructor) {
      return {
        eligible: false,
        reason: 'Course has not been marked as complete by instructor'
      };
    }

    // Get all assignments and quizzes for the course
    const assignments = await Assignment.find({
      course: course._id
    });
    
    const quizzes = await Quiz.find({
      course: course._id
    });

    let totalAssignments = assignments.length;
    let completedAssignments = 0;
    let assignmentScores = [];
    
    let totalQuizzes = quizzes.length;
    let completedQuizzes = 0;
    let quizScores = [];

    // Check assignment completion and grades
    for (const assignment of assignments) {
      const submission = assignment.submissions.find(sub => 
        sub.student.toString() === student._id.toString() && 
        sub.status === 'graded' && 
        sub.grade !== null && 
        sub.grade >= (course.passingThreshold || 40)
      );
      
      if (submission) {
        completedAssignments++;
        assignmentScores.push(submission.grade);
      }
    }

    // Check quiz completion and scores
    for (const quiz of quizzes) {
      const attempt = quiz.attempts.find(att => 
        att.student.toString() === student._id.toString()
      );
      
      if (attempt && attempt.score >= (course.passingThreshold || 40)) {
        completedQuizzes++;
        quizScores.push(attempt.score);
      }
    }

    // Check if all assignments are completed with passing grades
    if (totalAssignments > 0 && completedAssignments < totalAssignments) {
      return {
        eligible: false,
        reason: `Student has completed ${completedAssignments} out of ${totalAssignments} assignments with passing grades`
      };
    }

    // Check if all quizzes are completed with passing scores
    if (totalQuizzes > 0 && completedQuizzes < totalQuizzes) {
      return {
        eligible: false,
        reason: `Student has completed ${completedQuizzes} out of ${totalQuizzes} quizzes with passing scores`
      };
    }

    // Calculate overall score
    const allScores = [...assignmentScores, ...quizScores];
    const overallScore = allScores.length > 0 
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
      : null;

    // Determine grade based on overall score
    let grade = 'Pass';
    if (overallScore !== null) {
      if (overallScore >= 90) grade = 'Distinction';
      else if (overallScore >= 80) grade = 'Merit';
      else if (overallScore >= (course.passingThreshold || 40)) grade = 'Pass';
    }

    return {
      eligible: true,
      reason: `All requirements completed. Overall score: ${overallScore || 'N/A'}%`,
      overallScore,
      grade
    };

  } catch (error) {
    console.error('Error checking student eligibility:', error);
    return {
      eligible: false,
      reason: 'Error evaluating student eligibility'
    };
  }
};

// @desc    Get certificate for student (download endpoint)
// @route   GET /api/courses/:courseId/certificate?userId=<id>
// @access  Private
exports.getCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.query.userId || req.user._id;
    
    // Check authorization - students can only get their own certificates
    if (req.user._id.toString() !== userId && req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return sendForbidden(res, "Not authorized to access this certificate");
    }

    // Find the certificate
    const certificate = await Certificate.findOne({
      student: userId,
      course: courseId
    }).populate('student', 'name email').populate('course', 'title instructor');

    if (!certificate) {
      return sendNotFound(res, "Certificate not found. This course may not have been completed or the certificate may not have been generated.");
    }

    // Check if the requesting user is authorized for this certificate
    const course = certificate.course;
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user._id.toString()) {
      return sendForbidden(res, "Not authorized to access certificates for this course");
    }

    // Return certificate information (for PDF download, would need to serve the actual file)
    return sendSuccess(res, {
      certificateId: certificate.certificateId,
      certificateUrl: certificate.certificateUrl,
      studentName: certificate.student.name,
      courseTitle: certificate.course.title,
      grade: certificate.grade,
      overallScore: certificate.overallScore,
      issuedAt: certificate.issuedAt.toISOString(),
      verificationUrl: certificate.verificationUrl
    }, "Certificate retrieved successfully");

  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Download certificate PDF directly
// @route   GET /api/certificates/download/:courseId
// @access  Private
exports.downloadCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.query.userId || req.user._id;

    // Find the certificate first
    const certificate = await Certificate.findOne({
      student: userId,
      course: courseId
    }).populate('student', 'name email').populate('course', 'title instructor');

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found. This course may not have been completed or the certificate may not have been generated." });
    }

    // Check authorization based on user role
    const course = certificate.course;

    // Allow access if:
    // 1. User is the student who owns the certificate
    // 2. User is the instructor of the course
    // 3. User is an admin
    const isAuthorized =
      req.user._id.toString() === userId || // Student owns certificate
      course.instructor.toString() === req.user._id.toString() || // User is course instructor
      req.user.role === 'admin'; // User is admin



    if (!isAuthorized) {
      return res.status(403).json({
        message: "Not authorized to access this certificate. Students can only download their own certificates, instructors can only download certificates for their courses."
      });
    }

    // Serve the PDF file
    const filePath = path.join(__dirname, '../..', certificate.certificateUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Certificate file not found. Please contact support." });
    }

    // Set proper headers for PDF viewing in new tab
    const fileName = `certificate-${course.title.replace(/\s+/g, '-')}-${certificate.student.name.replace(/\s+/g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('Error streaming certificate file:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error downloading certificate" });
      }
    });

  } catch (err) {
    console.error('Download certificate error:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
