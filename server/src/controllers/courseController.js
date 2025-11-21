const Course = require("../models/Course");
const Review = require("../models/Review");
const Certificate = require("../models/Certificate");
const pdfGenerator = require("../utils/pdfGenerator");
const { sendSuccess, sendSuccessList, sendError, sendNotFound, sendForbidden, sendConflict, sendValidationError } = require("../utils/apiResponse");

// ---------------- CONTROLLERS ----------------

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor only)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, price, modules } = req.body;

    const course = new Course({
      title,
      description,
      category,
      price,
      modules,
      instructor: req.user._id,
    });

    const savedCourse = await course.save();
    return sendSuccess(res, savedCourse, 'Course created successfully', 201);
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Get all courses (with search & filter)
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const { 
      keyword, 
      category, 
      free, 
      sort, 
      instructor, 
      difficulty, 
      minRating,
      page = 1, 
      limit = 12 
    } = req.query;

    let query = {};

    // Search by title, description, or instructor name
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = { $regex: category, $options: "i" };
    }

    // Filter by price (free or paid)
    if (free === "true") {
      query.price = 0;
    } else if (free === "false") {
      query.price = { $gt: 0 };
    }

    // Filter by minimum rating
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    let courses = Course.find(query)
      .populate("instructor", "name email")
      .populate("reviews");

    // Filter by instructor name if provided
    if (instructor) {
      // First get instructors matching the name
      const User = require("../models/User");
      const instructors = await User.find({
        name: { $regex: instructor, $options: "i" },
        role: "instructor"
      }).select("_id");
      
      if (instructors.length > 0) {
        query.instructor = { $in: instructors.map(i => i._id) };
        courses = Course.find(query).populate("instructor", "name email").populate("reviews");
      } else {
        // No instructors found, return empty result
        return res.json({ courses: [], totalPages: 0, currentPage: page, total: 0 });
      }
    }

    // Sorting
    if (sort === "latest") {
      courses = courses.sort({ createdAt: -1 });
    } else if (sort === "popular") {
      courses = courses.sort({ enrolledStudents: -1 });
    } else if (sort === "rating") {
      courses = courses.sort({ averageRating: -1 });
    } else if (sort === "price_low") {
      courses = courses.sort({ price: 1 });
    } else if (sort === "price_high") {
      courses = courses.sort({ price: -1 });
    } else {
      courses = courses.sort({ createdAt: -1 }); // default to latest
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    courses = courses.skip(startIndex).limit(parseInt(limit));

    const result = await courses;
    const total = await Course.countDocuments(query);

    // Add enrollment count and difficulty level to each course
    const enhancedCourses = result.map(course => ({
      ...course.toObject(),
      enrollmentCount: course.enrolledStudents.length,
      difficulty: course.difficulty || getDifficultyFromModules(course.modules)
    }));

    return sendSuccessList(res, enhancedCourses, {
      page: parseInt(page),
      pageSize: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: parseInt(page) < Math.ceil(total / limit),
      hasPrevPage: parseInt(page) > 1
    }, 'Courses retrieved successfully');
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// Helper function to determine difficulty based on course content
const getDifficultyFromModules = (modules) => {
  if (!modules || modules.length === 0) return 'Beginner';
  
  const totalLessons = modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
  const totalAssignments = modules.reduce((sum, module) => sum + (module.assignments?.length || 0), 0);
  const totalQuizzes = modules.reduce((sum, module) => sum + (module.quizzes?.length || 0), 0);
  
  const totalContent = totalLessons + totalAssignments + totalQuizzes;
  
  if (totalContent <= 10) return 'Beginner';
  if (totalContent <= 25) return 'Intermediate';
  return 'Advanced';
};

// Helper function to check course completion and auto-generate certificate
const checkAndGenerateCertificate = async (studentId, courseId, course, user) => {
  try {
    const courseProgress = user.progress.get(courseId.toString()) || { completedModules: [], completedLessons: [], grades: {}, scores: {} };
    const totalModules = course.modules.length;
    const completedModules = courseProgress.completedModules ? courseProgress.completedModules.length : 0;
    
    // Check if all modules are completed
    if (totalModules > 0 && completedModules === totalModules) {
      // Check if certificate already exists
      const existingCert = await Certificate.findOne({ student: studentId, course: courseId });
      if (existingCert) {
        console.log('Certificate already exists for student:', studentId, 'course:', courseId);
        return;
      }
      
      console.log('Auto-generating certificate for completed course:', courseId, 'student:', studentId);
      
      // Get instructor details
      const User = require('../models/User');
      const instructor = await User.findById(course.instructor);
      const student = await User.findById(studentId);
      
      if (!student || !instructor) {
        console.error('Student or instructor not found for certificate generation');
        return;
      }
      
      // Generate PDF certificate
      const certificateUrl = await pdfGenerator.generateCertificate({
        studentName: student.name,
        courseTitle: course.title,
        completionDate: new Date(),
        instructorName: instructor.name,
      });
      
      // Save certificate to database
      const certificate = new Certificate({
        student: studentId,
        course: courseId,
        grade: 'Pass', // You can customize this based on quiz scores or other criteria
        certificateUrl,
      });
      
      await certificate.save();
      console.log('Certificate auto-generated successfully:', certificate._id);
    }
  } catch (error) {
    console.error('Error in auto-certificate generation:', error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate({
        path: "reviews",
        populate: { path: "user", select: "name email" },
      })
      .populate({
        path: "enrolledStudents",
        select: "name email _id",
      })
      .populate('modules.assignments')
      .populate('modules.quizzes');

    if (!course) return sendNotFound(res, "Course not found");

    return sendSuccess(res, course, "Course retrieved successfully");
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
exports.enrollCourse = async (req, res) => {
  console.log('Enroll attempt: req.user =', req.user);
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      console.error('Enroll error: Course not found', req.params.id);
      return sendNotFound(res, "Course not found");
    }

    // Prevent instructors from enrolling in their own courses
    if (course.instructor.toString() === req.user._id.toString()) {
      console.warn('Enroll warning: Instructor cannot enroll in own course', req.user._id, course._id);
      return sendForbidden(res, "Instructors cannot enroll in their own courses");
    }

    if (course.enrolledStudents.includes(req.user._id)) {
      console.warn('Enroll warning: Already enrolled', req.user._id, course._id);
      return sendConflict(res, "Already enrolled");
    }

    // Add student to course
    course.enrolledStudents.push(req.user._id);
    await course.save();

    // Add course to user's enrolledCourses
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('Enroll error: User not found', req.user._id);
      return sendNotFound(res, "User not found");
    }
    if (!user.enrolledCourses.includes(course._id)) {
      user.enrolledCourses.push(course._id);
      await user.save();
    }

    return sendSuccess(res, course, "Enrolled successfully");
  } catch (err) {
    console.error('Enroll 500 error:', err);
    res.status(500).json({ message: "Server error", error: err.message, stack: err.stack });
  }
};

// @desc    Add review to course
// @route   POST /api/courses/:id/reviews
// @access  Private (Student)
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Only allow review if user is enrolled (safe)
    if (!Array.isArray(course.enrolledStudents) ||
        !course.enrolledStudents.map(id => id && id.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: "You must be enrolled in this course to write a review." });
    }

    const alreadyReviewed = await Review.findOne({
      course: course._id,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Course already reviewed" });
    }

    const review = new Review({
      course: course._id,
      user: req.user._id,
      rating,
      comment,
    });

    await review.save();

    course.reviews.push(review._id);

    // Recalculate average rating
    const reviews = await Review.find({ course: course._id });
    course.averageRating =
      reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length;

    await course.save();

    return sendSuccess(res, review, "Review added successfully", 201);
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Rate a course (1-5 stars)
// @route   POST /api/courses/:id/rate
// @access  Private (Student)
exports.rateCourse = async (req, res) => {
  try {
    const { rating, review } = req.body;
    
    // Validate rating (1-5 only)
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return sendValidationError(res, ["Rating must be an integer between 1 and 5"], "Invalid rating");
    }
    
    const course = await Course.findById(req.params.id);
    if (!course) return sendNotFound(res, "Course not found");

    // Only allow rating if user is enrolled
    if (!Array.isArray(course.enrolledStudents) ||
        !course.enrolledStudents.map(id => id && id.toString()).includes(req.user._id.toString())) {
      return sendForbidden(res, "You must be enrolled in this course to rate it.");
    }

    // Check if user has already rated this course
    const existingReview = await Review.findOne({
      course: course._id,
      user: req.user._id,
    });

    if (existingReview) {
      // Update existing rating
      existingReview.rating = rating;
      if (review && review.trim()) {
        existingReview.comment = review.trim();
      }
      existingReview.updatedAt = new Date();
      await existingReview.save();
      
      // Recalculate average rating
      const reviews = await Review.find({ course: course._id });
      course.averageRating = reviews.length > 0 
        ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length 
        : 0;
      
      await course.save();
      
      return sendSuccess(res, {
        rating: existingReview.rating,
        comment: existingReview.comment,
        averageRating: Math.round(course.averageRating * 10) / 10,
        totalRatings: reviews.length,
        updated: true
      }, "Rating updated successfully");
    } else {
      // Create new rating
      const newReview = new Review({
        course: course._id,
        user: req.user._id,
        rating,
        comment: review && review.trim() ? review.trim() : '',
      });

      await newReview.save();
      course.reviews.push(newReview._id);

      // Recalculate average rating
      const reviews = await Review.find({ course: course._id });
      course.averageRating = reviews.length > 0 
        ? reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length 
        : 0;

      await course.save();

      return sendSuccess(res, {
        rating: newReview.rating,
        comment: newReview.comment,
        averageRating: Math.round(course.averageRating * 10) / 10,
        totalRatings: reviews.length,
        updated: false
      }, "Course rated successfully", 201);
    }
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Get ratings for a course
// @route   GET /api/courses/:id/ratings
// @access  Public
exports.getCourseRatings = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'latest' } = req.query;
    
    const course = await Course.findById(req.params.id);
    if (!course) return sendNotFound(res, "Course not found");

    let sortCriteria = { createdAt: -1 }; // default: latest first
    if (sortBy === 'rating_high') sortCriteria = { rating: -1, createdAt: -1 };
    if (sortBy === 'rating_low') sortCriteria = { rating: 1, createdAt: -1 };
    if (sortBy === 'oldest') sortCriteria = { createdAt: 1 };

    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ course: course._id })
      .populate('user', 'name email')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalReviews = await Review.countDocuments({ course: course._id });
    const totalPages = Math.ceil(totalReviews / limit);

    // Calculate rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = await Review.countDocuments({ course: course._id, rating: i });
    }

    return sendSuccessList(res, reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      user: {
        _id: review.user._id,
        name: review.user.name
      },
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString()
    })), {
      page: parseInt(page),
      pageSize: parseInt(limit),
      total: totalReviews,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      averageRating: Math.round(course.averageRating * 10) / 10,
      ratingDistribution
    }, "Course ratings retrieved successfully");

  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @desc    Get course content and user progress
// @route   GET /api/courses/:id/content
// @access  Private (enrolled students)
exports.getCourseContent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('modules.lessons')
      .populate('modules.assignments')
      .populate('modules.quizzes');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Only allow if enrolled or instructor
    if (!course.enrolledStudents.map(id => id && id.toString()).includes(req.user._id.toString()) && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Progress: get from user.progress (Map)
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (!user.progress) {
      user.progress = new Map();
    }
    let progress = user.progress.get(course._id.toString()) || { completedModules: [], completedLessons: [], grades: {}, scores: {} };
    if (!user.progress.has(course._id.toString())) {
      user.progress.set(course._id.toString(), progress);
      await user.save();
    }
    const completedModules = progress.completedModules || [];
    const completedLessons = progress.completedLessons || [];
    const grades = progress.grades || {};
    const scores = progress.scores || {};

    // Map modules to include all lessons, assignments, and quizzes
    const modules = (course.modules || []).map(mod => ({
      _id: mod._id,
      title: mod.title,
      lessons: (mod.lessons || []).map(lesson => ({
        _id: lesson._id,
        title: lesson.title,
        contentType: lesson.contentType,
        content: lesson.content,
        contentUrl: lesson.contentUrl,
      })),
      assignments: (mod.assignments || []).map(assignment => ({
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        userSubmission: assignment.submissions.find(sub => sub.student.toString() === req.user._id.toString()) || null,
        // Add other assignment fields as needed
      })),
      quizzes: (mod.quizzes || []).map(quiz => ({
        _id: quiz._id,
        title: quiz.title,
        questions: quiz.questions,
        // Add other quiz fields as needed
      }))
    }));

    res.json({
      course: { _id: course._id, title: course.title },
      modules,
      completedModules,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark module as completed for user
// @route   POST /api/courses/:id/modules/:moduleId/complete
// @access  Private (enrolled students)
exports.completeModule = async (req, res) => {
  try {
    console.log('completeModule: called', req.params);
    const { id, moduleId } = req.params;
    let course;
    try {
      course = await Course.findById(id);
      console.log('completeModule: course found', course ? course._id : null);
    } catch (e) {
      console.error('completeModule: error finding course', e);
      return res.status(500).json({ message: 'Error finding course', error: e.message });
    }
    if (!course) {
      console.error('completeModule: Course not found', id);
      return res.status(404).json({ message: 'Course not found' });
    }
    let enrolled = false;
    try {
      enrolled = course.enrolledStudents.map(s => s && s.toString()).includes(req.user._id.toString());
      console.log('completeModule: enrolled check', enrolled);
    } catch (e) {
      console.error('completeModule: error checking enrollment', e);
      return res.status(500).json({ message: 'Error checking enrollment', error: e.message });
    }
    if (!enrolled) {
      console.error('completeModule: Not enrolled', req.user._id, id);
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    let user;
    try {
      const User = require('../models/User');
      user = await User.findById(req.user._id);
      console.log('completeModule: user found', user ? user._id : null);
    } catch (e) {
      console.error('completeModule: error finding user', e);
      return res.status(500).json({ message: 'Error finding user', error: e.message });
    }
    if (!user) {
      console.error('completeModule: User not found', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    // Ensure user.progress is a Map
    if (!user.progress) {
      user.progress = new Map();
      console.log('completeModule: initialized user.progress as new Map()');
    }
    let courseProgress;
    try {
      courseProgress = user.progress.get(id);
      console.log('completeModule: got courseProgress', courseProgress);
    } catch (e) {
      console.error('completeModule: error getting courseProgress', e);
      return res.status(500).json({ message: 'Error getting courseProgress', error: e.message });
    }
    if (!courseProgress) {
      courseProgress = { completedModules: [], completedLessons: [], grades: {}, scores: {} };
      console.log('completeModule: initialized courseProgress');
    }
    if (!courseProgress.completedModules.includes(moduleId)) {
      courseProgress.completedModules.push(moduleId);
      user.progress.set(id, courseProgress);
      try {
        await user.save();
        console.log('completeModule: user progress saved');
        
        // Check if course is completed and auto-generate certificate
        await checkAndGenerateCertificate(req.user._id, id, course, user);
        
      } catch (saveErr) {
        console.error('completeModule: Error saving user progress', saveErr);
        return res.status(500).json({ message: 'Server error (save user)', error: saveErr.message });
      }
    }
    res.json({ message: 'Module marked as completed', completedModules: courseProgress.completedModules });
  } catch (err) {
    console.error('completeModule: unknown error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark module as incomplete for user
// @route   POST /api/courses/:id/modules/:moduleId/incomplete
// @access  Private (enrolled students)
exports.incompleteModule = async (req, res) => {
  try {
    const { id, moduleId } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      console.error('incompleteModule: Course not found', id);
      return res.status(404).json({ message: 'Course not found' });
    }
    if (!course.enrolledStudents.map(s => s && s.toString()).includes(req.user._id.toString())) {
      console.error('incompleteModule: Not enrolled', req.user._id, id);
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('incompleteModule: User not found', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    // Ensure user.progress is a Map
    if (!user.progress) {
      user.progress = new Map();
    }
    let courseProgress = user.progress.get(id);
    if (!courseProgress) {
      courseProgress = { completedModules: [], completedLessons: [], grades: {}, scores: {} };
    }
    if (courseProgress.completedModules.includes(moduleId)) {
      courseProgress.completedModules = courseProgress.completedModules.filter(mid => mid !== moduleId);
      user.progress.set(id, courseProgress);
      try {
        await user.save();
      } catch (saveErr) {
        console.error('incompleteModule: Error saving user progress', saveErr);
        return res.status(500).json({ message: 'Server error (save user)', error: saveErr.message });
      }
    }
    res.json({ message: 'Module marked as incomplete', completedModules: courseProgress.completedModules });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Add a module to a course (Instructor only)
// @route   POST /api/courses/:id/modules
// @access  Private
exports.addModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Module title required' });
    course.modules.push({ title, lessons: [] });
    await course.save();
    res.status(201).json({ message: 'Module added', modules: course.modules });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a module from a course (Instructor only)
// @route   DELETE /api/courses/:id/modules/:moduleId
// @access  Private
exports.deleteModule = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    course.modules = course.modules.filter(m => m._id.toString() !== req.params.moduleId);
    await course.save();
    res.json({ message: 'Module deleted', modules: course.modules });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Upload PPT/PDF to a module (Instructor only)
// @route   POST /api/courses/:id/modules/:moduleId/upload
// @access  Private
exports.uploadModuleFiles = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const module = course.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });
    // Add or update lesson for ppt
    if (req.files && req.files.ppt && req.files.ppt[0]) {
      let pptLesson = module.lessons.find(l => l.contentType === 'slide');
      if (!pptLesson) {
        pptLesson = { title: 'PPT', contentType: 'slide', contentUrl: `/uploads/${req.files.ppt[0].filename}` };
        module.lessons.push(pptLesson);
      } else {
        pptLesson.contentUrl = `/uploads/${req.files.ppt[0].filename}`;
      }
    }
    // Add or update lesson for pdf
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      let pdfLesson = module.lessons.find(l => l.contentType === 'pdf');
      if (!pdfLesson) {
        pdfLesson = { title: 'PDF', contentType: 'pdf', contentUrl: `/uploads/${req.files.pdf[0].filename}` };
        module.lessons.push(pdfLesson);
      } else {
        pdfLesson.contentUrl = `/uploads/${req.files.pdf[0].filename}`;
      }
    }
    await course.save();
    res.json({ message: 'Files uploaded', module });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get enrolled students and their progress for a course (Instructor only)
// @route   GET /api/courses/:id/progress
// @access  Private
exports.getCourseProgress = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('enrolledStudents', 'name email progress');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const students = (course.enrolledStudents || []).map(student => {
      const progress = student.progress && student.progress.get(course._id.toString());
      const completedModules = progress ? progress.completedModules || [] : [];
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        completedModules,
      };
    });
    res.json({ students, modules: course.modules.map(m => ({ _id: m._id, title: m.title })) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Add a lesson to a module (Instructor only)
// @route   POST /api/courses/:id/modules/:moduleId/lessons
// @access  Private
exports.addLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const module = course.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });
    const { title, contentType, content, contentUrl } = req.body;
    if (!title || !contentType) return res.status(400).json({ message: 'Lesson title and type required' });
    let lesson = { title, contentType };
    if (contentType === 'text') lesson.content = content;
    if (contentType === 'pdf' || contentType === 'slide' || contentType === 'doc' || contentType === 'video') lesson.contentUrl = contentUrl;
    module.lessons.push(lesson);
    await course.save();
    res.status(201).json({ message: 'Lesson added', lessons: module.lessons });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete a lesson from a module (Instructor only)
// @route   DELETE /api/courses/:id/modules/:moduleId/lessons/:lessonId
// @access  Private
exports.deleteLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const module = course.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });
    module.lessons = module.lessons.filter(l => l._id.toString() !== req.params.lessonId);
    await course.save();
    res.json({ message: 'Lesson deleted', lessons: module.lessons });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Upload a file for a lesson (Instructor only)
// @route   POST /api/courses/:id/modules/:moduleId/lessons/:lessonId/upload
// @access  Private
exports.uploadLessonFile = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const module = course.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });
    const lesson = module.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    if (req.file) {
      lesson.contentUrl = `/uploads/${req.file.filename}`;
      await course.save();
      return res.json({ message: 'File uploaded', lesson });
    }
    res.status(400).json({ message: 'No file uploaded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Check course completion and generate certificate if eligible
// @route   POST /api/courses/:id/check-completion
// @access  Private (Student)
exports.checkCourseCompletion = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('modules.assignments')
      .populate('modules.quizzes');

    if (!course) return sendNotFound(res, "Course not found");

    // Verify student is enrolled
    if (!course.enrolledStudents.includes(req.user._id)) {
      return sendForbidden(res, "You are not enrolled in this course");
    }

    // Get user's progress
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (!user || !user.progress) {
      return res.status(200).json({
        completed: false,
        progress: 0,
        message: "No progress data found"
      });
    }

    const courseProgress = user.progress.get(course._id.toString());
    if (!courseProgress) {
      return res.status(200).json({
        completed: false,
        progress: 0,
        message: "No progress data found for this course"
      });
    }

    // Calculate completion percentage
    let totalItems = 0;
    let completedItems = 0;

    // Check modules completion
    course.modules.forEach(module => {
      if (courseProgress.completedModules && courseProgress.completedModules.includes(module._id.toString())) {
        completedItems++;
      }
      totalItems++;

      // Check lessons completion (if lessons exist)
      if (module.lessons && module.lessons.length > 0) {
        module.lessons.forEach(lesson => {
          totalItems++;
          if (courseProgress.completedLessons && courseProgress.completedLessons.includes(lesson._id.toString())) {
            completedItems++;
          }
        });
      }

      // Check assignments completion
      if (module.assignments && module.assignments.length > 0) {
        module.assignments.forEach(assignment => {
          totalItems++;
          if (courseProgress.grades && courseProgress.grades[assignment._id.toString()] !== undefined) {
            completedItems++;
          }
        });
      }

      // Check quizzes completion
      if (module.quizzes && module.quizzes.length > 0) {
        module.quizzes.forEach(quiz => {
          totalItems++;
          if (courseProgress.scores && courseProgress.scores[quiz._id.toString()] !== undefined) {
            completedItems++;
          }
        });
      }
    });

    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Check if course is completed
    const isCompleted = progressPercentage >= 100;

    if (isCompleted && !courseProgress.certificateGenerated) {
      // Generate certificate
      try {
        await generateCertificateForStudent(course, user, courseProgress);
        courseProgress.certificateGenerated = true;
        await user.save();

        return res.status(200).json({
          completed: true,
          progress: progressPercentage,
          certificateGenerated: true,
          message: "Course completed! Certificate has been generated."
        });
      } catch (certError) {
        console.error('Certificate generation error:', certError);
        return res.status(200).json({
          completed: true,
          progress: progressPercentage,
          certificateGenerated: false,
          message: "Course completed but certificate generation failed. Please contact support."
        });
      }
    }

    return res.status(200).json({
      completed: isCompleted,
      progress: progressPercentage,
      certificateGenerated: courseProgress.certificateGenerated || false,
      message: isCompleted ? "Course completed!" : `${Math.round(progressPercentage)}% complete`
    });

  } catch (err) {
    console.error('Course completion check error:', err);
    return sendError(res, "Server error", 500, err.message);
  }
};

// Helper function to generate certificate for completed course
async function generateCertificateForStudent(course, student, courseProgress) {
  try {
    // Calculate overall grade
    let totalAssignments = 0;
    let totalAssignmentPoints = 0;
    let totalQuizzes = 0;
    let totalQuizPoints = 0;

    // Calculate assignment scores
    if (courseProgress.grades) {
      Object.values(courseProgress.grades).forEach(grade => {
        if (grade !== undefined && grade !== null) {
          totalAssignments++;
          totalAssignmentPoints += grade;
        }
      });
    }

    // Calculate quiz scores
    if (courseProgress.scores) {
      Object.values(courseProgress.scores).forEach(score => {
        if (score !== undefined && score !== null) {
          totalQuizzes++;
          totalQuizPoints += score;
        }
      });
    }

    // Calculate weighted average
    let overallScore = 0;
    if (totalAssignments + totalQuizzes > 0) {
      const assignmentWeight = totalAssignments / (totalAssignments + totalQuizzes);
      const quizWeight = totalQuizzes / (totalAssignments + totalQuizzes);
      overallScore = (totalAssignmentPoints * assignmentWeight) + (totalQuizPoints * quizWeight);
    }

    // Determine grade
    let grade = "Pass";
    if (overallScore >= 85) grade = "Distinction";
    else if (overallScore >= 70) grade = "Merit";

    // Generate PDF certificate
    const certificateData = {
      studentName: student.name,
      courseTitle: course.title,
      instructorName: course.instructor.name || "Course Instructor",
      completionDate: new Date().toLocaleDateString(),
      grade: grade,
      score: Math.round(overallScore),
      certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    const certificateBuffer = await pdfGenerator.generateCertificate(certificateData);

    // Save certificate to uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads/certificates');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `certificate_${student._id}_${course._id}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, certificateBuffer);

    // Create certificate record in database
    const certificate = new Certificate({
      student: student._id,
      course: course._id,
      certificateId: certificateData.certificateId,
      certificateUrl: `/uploads/certificates/${filename}`,
      grade: grade,
      overallScore: Math.round(overallScore),
      issuedBy: course.instructor,
      metadata: {
        pdfGeneratedAt: new Date(),
        fileSize: certificateBuffer.length,
        version: "1.0"
      }
    });

    await certificate.save();

    return certificate;

  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}
