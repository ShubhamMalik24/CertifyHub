const QuizGenerator = require("../utils/quizGenerator");

// @desc    Create a new quiz for a module
// @route   POST /api/quizzes
// @access  Private (Instructor only)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, questions, courseId, moduleId, timeLimit } = req.body;

    // Verify instructor owns the course
    const course = await Course.findById(courseId);
    if (!course) {
      return sendNotFound(res, "Course not found");
    }
    if (course.instructor.toString() !== req.user._id.toString()) {
      return sendForbidden(res, "Not authorized to create quiz for this course");
    }

    const quiz = new Quiz({
      title,
      description,
      questions,
      course: courseId,
      module: moduleId,
      timeLimit,
    });

    const savedQuiz = await quiz.save();

    // Add to course module
    const module = course.modules.id(moduleId);
    if (module) {
      module.quizzes.push(savedQuiz._id);
      await course.save();
    }

    return sendSuccess(res, savedQuiz, "Quiz created successfully", 201);
  } catch (err) {
    return sendError(res, "Server error", 500, err.message);
  }
};

// @route   GET /api/quizzes/:courseId
// @access  Private
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId }).populate("attempts.student", "name email");
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route   GET /api/quizzes/single/:id
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return sendNotFound(res, "Quiz not found");

    // For students, hide correct answers
    const quizData = quiz.toObject();
    if (req.user.role === "student") {
      quizData.questions = quiz.questions.map((q, index) => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        points: q.points,
        questionIndex: index
        // correctAnswer is hidden for students
      }));
    } else {
      // For instructors, include correct answers
      quizData.questions = quiz.questions.map((q, index) => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        questionIndex: index
      }));
    }

    return sendSuccess(res, quizData, "Quiz retrieved successfully");
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionIndex, selectedAnswer }]
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) return sendNotFound(res, "Quiz not found");

    // Check if already attempted (one submission only)
    const existingAttempt = quiz.attempts.find(att => att.student.toString() === req.user._id.toString());
    if (existingAttempt) {
      return sendConflict(res, "Quiz has already been submitted. Only one submission is allowed per quiz.");
    }

    // Validate answers format
    if (!Array.isArray(answers) || answers.length === 0) {
      return sendValidationError(res, ["Answers are required"], "Invalid submission");
    }

    // Calculate score with detailed results
    let correct = 0;
    const questionResults = [];
    
    let totalPossiblePoints = 0;
    let earnedPoints = 0;
    
    answers.forEach((ans) => {
      const question = quiz.questions[ans.questionIndex];
      if (!question) {
        questionResults.push({
          questionIndex: ans.questionIndex,
          selectedAnswer: ans.selectedAnswer,
          correctAnswer: null,
          isCorrect: false,
          points: 0,
          possiblePoints: 0,
          error: 'Question not found'
        });
        return;
      }
      
      const isCorrect = question.correctAnswer === ans.selectedAnswer;
      const pointsEarned = isCorrect ? (question.points || 1) : 0;
      const possiblePoints = question.points || 1;
      
      if (isCorrect) {
        correct++;
      }
      
      earnedPoints += pointsEarned;
      totalPossiblePoints += possiblePoints;
      
      questionResults.push({
        questionIndex: ans.questionIndex,
        questionText: question.text,
        selectedAnswer: ans.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: pointsEarned,
        possiblePoints
      });
    });
    
    const totalQuestions = quiz.questions.length;
    const score = totalPossiblePoints > 0 ? (earnedPoints / totalPossiblePoints) * 100 : 0;

    quiz.attempts.push({
      student: req.user._id,
      answers,
      score,
    });

    await quiz.save();

    // Update user progress
    const user = await User.findById(req.user._id);
    if (!user.progress.has(quiz.course.toString())) {
      user.progress.set(quiz.course.toString(), {});
    }
    const courseProgress = user.progress.get(quiz.course.toString());
    if (!courseProgress.scores) courseProgress.scores = {};
    courseProgress.scores[quiz._id.toString()] = score;
    await user.save();

    // Return detailed grading result
    const gradingResult = {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      earnedPoints,
      totalPoints: totalPossiblePoints,
      percentage: Math.round(score * 100) / 100,
      questionsCorrect: correct,
      totalQuestions,
      questionResults,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };
    
    return sendSuccess(res, gradingResult, "Quiz submitted and graded successfully");
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Instructor)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Verify instructor
    const course = await Course.findById(quiz.course);
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Remove from course module
    const module = course.modules.id(quiz.module);
    if (module) {
      module.quizzes = module.quizzes.filter(q => q.toString() !== quiz._id.toString());
      await course.save();
    }

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// @route   POST /api/quizzes/generate
// @access  Private (Instructor only)
exports.generateQuiz = async (req, res) => {
  try {
    const { title, description, topic, content, courseId, moduleId, difficulty = 3, numQuestions = 5 } = req.body;

    // Validate required fields
    if (!title || !description || !topic || !content || !courseId || !moduleId) {
      return sendValidationError(res, ["title", "description", "topic", "content", "courseId", "moduleId"], "Missing required fields");
    }

    // Verify instructor owns the course
    const course = await Course.findById(courseId);
    if (!course) {
      return sendNotFound(res, "Course not found");
    }
    if (course.instructor.toString() !== req.user._id.toString()) {
      return sendForbidden(res, "Not authorized to create quiz for this course");
    }

    // Generate quiz questions using AI
    const quizData = await QuizGenerator.generateQuiz(title, description, topic, content, difficulty, numQuestions);

    // Create the quiz in database
    const quiz = new Quiz({
      ...quizData,
      course: courseId,
      module: moduleId,
    });

    const savedQuiz = await quiz.save();

    // Add to course module
    const module = course.modules.id(moduleId);
    if (module) {
      module.quizzes.push(savedQuiz._id);
      await course.save();
    }

    return sendSuccess(res, {
      ...savedQuiz.toObject(),
      aiGenerated: true,
      generationInfo: {
        topic,
        difficulty,
        numQuestions,
        generatedAt: new Date()
      }
    }, "Quiz generated successfully using AI", 201);
  } catch (err) {
    console.error('Error generating quiz:', err);
    return sendError(res, "Failed to generate quiz", 500, err.message);
  }
};
