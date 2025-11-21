const User = require("../models/User");
const Course = require("../models/Course");
const Certificate = require("../models/Certificate");
const Assignment = require("../models/Assignment");
const Quiz = require("../models/Quiz");
const { sendSuccess, sendSuccessList, sendError, sendNotFound, sendForbidden, sendConflict, sendValidationError } = require("../utils/apiResponse");
const multer = require("multer");
const path = require("path");

// ---------------- FILE UPLOAD CONFIG ----------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // files will be stored in /uploads
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5 MB
});

// ---------------- CONTROLLERS ----------------

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
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

// @desc    Update user profile (bio, skills)
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const { bio, skills } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (bio) user.bio = bio;
    if (skills) user.skills = Array.isArray(skills) ? skills : skills.split(",");

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private
exports.uploadProfilePicture = [
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.profilePicture = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({ message: "Profile picture updated", file: req.file });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },
];

// @desc    Get student dashboard data
// @route   GET /api/users/dashboard/student
// @access  Private (Student)
exports.getStudentDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({
        path: 'enrolledCourses',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Get certificates for this student
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title');

    // Calculate progress for enrolled courses
    const coursesWithProgress = await Promise.all(
      user.enrolledCourses.map(async (course) => {
        const progress = user.progress.get(course._id.toString()) || { completedModules: [], completedLessons: [], grades: {}, scores: {} };
        const totalModules = course.modules.length;
        const completedModules = progress.completedModules ? progress.completedModules.length : 0;
        const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        // Get assignments and quizzes for this course
        const assignments = await Assignment.find({ course: course._id });
        const quizzes = await Quiz.find({ course: course._id });
        
        const assignmentSubmissions = assignments.reduce((count, assignment) => {
          const hasSubmitted = assignment.submissions.some(sub => sub.student.toString() === req.user._id.toString());
          return count + (hasSubmitted ? 1 : 0);
        }, 0);
        
        const quizAttempts = quizzes.reduce((count, quiz) => {
          const hasAttempted = quiz.attempts.some(attempt => attempt.student.toString() === req.user._id.toString());
          return count + (hasAttempted ? 1 : 0);
        }, 0);
        
        return {
          ...course.toObject(),
          progress: {
            percentage: progressPercentage,
            completedModules,
            totalModules,
            assignmentSubmissions,
            totalAssignments: assignments.length,
            quizAttempts,
            totalQuizzes: quizzes.length
          }
        };
      })
    );

    // Get recent assignments and quizzes
    const recentAssignments = await Assignment.find({
      course: { $in: user.enrolledCourses.map(c => c._id) },
      dueDate: { $gte: new Date() }
    })
      .populate('course', 'title')
      .sort({ dueDate: 1 })
      .limit(5);

    const recentQuizzes = await Quiz.find({
      course: { $in: user.enrolledCourses.map(c => c._id) }
    })
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture
      },
      enrolledCourses: coursesWithProgress,
      certificates: certificates.length,
      recentAssignments,
      recentQuizzes,
      stats: {
        totalCourses: user.enrolledCourses.length,
        completedCourses: certificates.length,
        inProgressCourses: coursesWithProgress.filter(c => c.progress.percentage > 0 && c.progress.percentage < 100).length
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get instructor dashboard data
// @route   GET /api/users/dashboard/instructor
// @access  Private (Instructor)
exports.getInstructorDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get courses created by this instructor
    const createdCourses = await Course.find({ instructor: req.user._id })
      .populate('enrolledStudents', 'name email')
      .populate('reviews');

    // Get detailed analytics for each course
    const coursesWithAnalytics = await Promise.all(
      createdCourses.map(async (course) => {
        const assignments = await Assignment.find({ course: course._id });
        const quizzes = await Quiz.find({ course: course._id });
        const certificates = await Certificate.find({ course: course._id });
        
        const totalSubmissions = assignments.reduce((sum, assignment) => sum + assignment.submissions.length, 0);
        const totalQuizAttempts = quizzes.reduce((sum, quiz) => sum + quiz.attempts.length, 0);
        
        return {
          ...course.toObject(),
          analytics: {
            totalStudents: course.enrolledStudents.length,
            totalAssignments: assignments.length,
            totalQuizzes: quizzes.length,
            totalSubmissions,
            totalQuizAttempts,
            completionRate: course.enrolledStudents.length > 0 ? Math.round((certificates.length / course.enrolledStudents.length) * 100) : 0,
            averageRating: course.averageRating || 0
          }
        };
      })
    );

    // Get recent student activities
    const recentAssignmentSubmissions = await Assignment.find(
      { course: { $in: createdCourses.map(c => c._id) } }
    )
      .populate({
        path: 'submissions.student',
        select: 'name email'
      })
      .populate('course', 'title')
      .sort({ 'submissions.submittedAt': -1 })
      .limit(10);

    const recentQuizAttempts = await Quiz.find(
      { course: { $in: createdCourses.map(c => c._id) } }
    )
      .populate({
        path: 'attempts.student',
        select: 'name email'
      })
      .populate('course', 'title')
      .sort({ 'attempts.attemptedAt': -1 })
      .limit(10);

    const totalStudents = createdCourses.reduce((sum, course) => sum + course.enrolledStudents.length, 0);
    const totalRevenue = createdCourses.reduce((sum, course) => sum + (course.price * course.enrolledStudents.length), 0);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture
      },
      createdCourses: coursesWithAnalytics,
      recentAssignmentSubmissions: recentAssignmentSubmissions.flatMap(assignment => 
        assignment.submissions.slice(-5).map(submission => ({
          ...submission.toObject(),
          assignmentTitle: assignment.title,
          courseTitle: assignment.course.title
        }))
      ).slice(0, 10),
      recentQuizAttempts: recentQuizAttempts.flatMap(quiz => 
        quiz.attempts.slice(-5).map(attempt => ({
          ...attempt.toObject(),
          quizTitle: quiz.title,
          courseTitle: quiz.course.title
        }))
      ).slice(0, 10),
      stats: {
        totalCourses: createdCourses.length,
        totalStudents,
        totalRevenue,
        averageRating: createdCourses.length > 0 ? 
          createdCourses.reduce((sum, course) => sum + (course.averageRating || 0), 0) / createdCourses.length : 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/users/dashboard/admin
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalCourses = await Course.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    
    // Recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Recent courses
    const recentCourses = await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Course enrollment stats
    const coursesWithStats = await Course.aggregate([
      {
        $project: {
          title: 1,
          instructor: 1,
          enrolledCount: { $size: '$enrolledStudents' },
          price: 1,
          averageRating: 1,
          createdAt: 1
        }
      },
      { $sort: { enrolledCount: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        totalCertificates
      },
      recentUsers,
      recentCourses,
      topCourses: coursesWithStats
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('enrolledCourses', 'title')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.role = role;
    await user.save();
    
    res.json({ message: "User role updated", user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Remove user from enrolled courses
    await Course.updateMany(
      { enrolledStudents: req.params.id },
      { $pull: { enrolledStudents: req.params.id } }
    );
    
    // Delete user's certificates
    await Certificate.deleteMany({ student: req.params.id });
    
    // Delete user's assignment submissions and quiz attempts
    await Assignment.updateMany(
      {},
      { $pull: { submissions: { student: req.params.id } } }
    );
    
    await Quiz.updateMany(
      {},
      { $pull: { attempts: { student: req.params.id } } }
    );
    
    await User.findByIdAndDelete(req.params.id);
    
    return sendSuccess(res, {}, "User deleted successfully");
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Get enrolled students for a course (Instructor/Admin)
// @route   GET /api/courses/:courseId/students
// @access  Private (Instructor/Admin)
exports.getCourseStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'name' } = req.query;
    const courseId = req.params.courseId;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return sendNotFound(res, "Course not found");
    }
    
    // Check authorization - only course instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendForbidden(res, "Not authorized to view students for this course");
    }
    
    let query = {
      _id: { $in: course.enrolledStudents },
      role: 'student'
    };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    let sortCriteria = {};
    switch (sortBy) {
      case 'name':
        sortCriteria = { name: 1 };
        break;
      case 'email':
        sortCriteria = { email: 1 };
        break;
      case 'enrolledDate':
        sortCriteria = { createdAt: -1 };
        break;
      default:
        sortCriteria = { name: 1 };
    }
    
    const skip = (page - 1) * limit;
    
    const students = await User.find(query)
      .select('name email createdAt progress')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Enhance students with course progress
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const progress = student.progress.get(courseId) || { completedModules: [], completedLessons: [], grades: {}, scores: {} };
        const totalModules = course.modules.length;
        const completedModules = progress.completedModules ? progress.completedModules.length : 0;
        const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        // Get assignments and quiz submissions
        const assignments = await Assignment.find({ course: courseId });
        const quizzes = await Quiz.find({ course: courseId });
        
        const assignmentSubmissions = assignments.reduce((count, assignment) => {
          const hasSubmitted = assignment.submissions.some(sub => sub.student.toString() === student._id.toString());
          return count + (hasSubmitted ? 1 : 0);
        }, 0);
        
        const quizAttempts = quizzes.reduce((count, quiz) => {
          const hasAttempted = quiz.attempts.some(attempt => attempt.student.toString() === student._id.toString());
          return count + (hasAttempted ? 1 : 0);
        }, 0);
        
        // Check if student has certificate
        const certificate = await Certificate.findOne({ student: student._id, course: courseId });
        
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          enrolledDate: student.createdAt,
          progress: {
            percentage: progressPercentage,
            completedModules,
            totalModules,
            assignmentSubmissions,
            totalAssignments: assignments.length,
            quizAttempts,
            totalQuizzes: quizzes.length
          },
          hasCertificate: !!certificate,
          certificateId: certificate ? certificate.certificateId : null
        };
      })
    );
    
    return sendSuccessList(res, studentsWithProgress, {
      page: parseInt(page),
      pageSize: parseInt(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }, "Course students retrieved successfully");
    
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Export course students to CSV
// @route   GET /api/courses/:courseId/students/export
// @access  Private (Instructor/Admin)
exports.exportCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return sendNotFound(res, "Course not found");
    }
    
    // Check authorization
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendForbidden(res, "Not authorized to export students for this course");
    }
    
    const students = await User.find({
      _id: { $in: course.enrolledStudents },
      role: 'student'
    }).select('name email createdAt progress');
    
    // Prepare CSV data
    const csvData = [];
    
    // CSV headers
    csvData.push([
      'Student Name',
      'Email',
      'Enrolled Date',
      'Progress %',
      'Completed Modules',
      'Total Modules',
      'Assignment Submissions',
      'Total Assignments',
      'Quiz Attempts',
      'Total Quizzes',
      'Has Certificate'
    ]);
    
    // Get assignments and quizzes for calculations
    const assignments = await Assignment.find({ course: courseId });
    const quizzes = await Quiz.find({ course: courseId });
    
    for (const student of students) {
      const progress = student.progress.get(courseId) || { completedModules: [], completedLessons: [], grades: {}, scores: {} };
      const totalModules = course.modules.length;
      const completedModules = progress.completedModules ? progress.completedModules.length : 0;
      const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      
      const assignmentSubmissions = assignments.reduce((count, assignment) => {
        const hasSubmitted = assignment.submissions.some(sub => sub.student.toString() === student._id.toString());
        return count + (hasSubmitted ? 1 : 0);
      }, 0);
      
      const quizAttempts = quizzes.reduce((count, quiz) => {
        const hasAttempted = quiz.attempts.some(attempt => attempt.student.toString() === student._id.toString());
        return count + (hasAttempted ? 1 : 0);
      }, 0);
      
      const certificate = await Certificate.findOne({ student: student._id, course: courseId });
      
      csvData.push([
        student.name,
        student.email,
        student.createdAt.toISOString().split('T')[0], // Date only
        progressPercentage + '%',
        completedModules,
        totalModules,
        assignmentSubmissions,
        assignments.length,
        quizAttempts,
        quizzes.length,
        certificate ? 'Yes' : 'No'
      ]);
    }
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(field => 
        typeof field === 'string' && (field.includes(',') || field.includes('\n') || field.includes('"'))
          ? `"${field.replace(/"/g, '""')}"`
          : field
      ).join(',')
    ).join('\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${course.title.replace(/[^a-z0-9]/gi, '_')}_students.csv"`);
    
    res.send(csvString);
    
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Get platform analytics (Admin)
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = parseInt(period);
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - daysAgo);
    
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalCourses = await Course.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    
    // Active users in period
    const activeUsers7Days = await User.countDocuments({
      lastLoginDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    const activeUsers30Days = await User.countDocuments({
      lastLoginDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const activeUsers90Days = await User.countDocuments({
      lastLoginDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    });
    
    // New users in period
    const newUsers = await User.countDocuments({
      createdAt: { $gte: periodStart }
    });
    
    // Course enrollment stats
    const courses = await Course.find().select('enrolledStudents title price');
    const totalEnrollments = courses.reduce((sum, course) => sum + course.enrolledStudents.length, 0);
    const totalRevenue = courses.reduce((sum, course) => sum + (course.price * course.enrolledStudents.length), 0);
    
    // Completion rate
    const completionRate = totalEnrollments > 0 ? Math.round((totalCertificates / totalEnrollments) * 100) : 0;
    
    // Average grade calculation
    const allAssignments = await Assignment.find();
    const allGrades = [];
    allAssignments.forEach(assignment => {
      assignment.submissions.forEach(submission => {
        if (submission.grade !== null && submission.grade !== undefined) {
          allGrades.push(submission.grade);
        }
      });
    });
    
    const averageGrade = allGrades.length > 0 
      ? Math.round(allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length * 100) / 100
      : 0;
    
    // Top performing courses
    const topCourses = courses
      .map(course => ({
        _id: course._id,
        title: course.title,
        enrollmentCount: course.enrolledStudents.length,
        revenue: course.price * course.enrolledStudents.length
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 10);
    
    // Growth metrics (simplified)
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysAgo);
    
    const previousNewUsers = await User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: periodStart }
    });
    
    const userGrowthRate = previousNewUsers > 0 
      ? Math.round(((newUsers - previousNewUsers) / previousNewUsers) * 100)
      : 0;
    
    return sendSuccess(res, {
      overview: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        totalCertificates,
        totalRevenue,
        completionRate,
        averageGrade
      },
      activeUsers: {
        last7Days: activeUsers7Days,
        last30Days: activeUsers30Days,
        last90Days: activeUsers90Days
      },
      growth: {
        newUsersThisPeriod: newUsers,
        newUsersPreviousPeriod: previousNewUsers,
        userGrowthRate
      },
      topCourses,
      period: {
        days: daysAgo,
        start: periodStart.toISOString(),
        end: new Date().toISOString()
      }
    }, "Platform analytics retrieved successfully");
    
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};
