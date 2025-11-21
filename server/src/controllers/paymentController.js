const Razorpay = require("razorpay");
const crypto = require("crypto");
const Course = require("../models/Course");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID || "rzp_test_RiNlMHooaIbuhN";
const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "J68VbkispdKmEtpepopH1TIO";

const ensureRazorpayConfigured = () => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured");
  }
};

const getRazorpayInstance = () => {
  ensureRazorpayConfigured();
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
};

const enrollUserInCourse = async (userId, course) => {
  if (!course.enrolledStudents.includes(userId)) {
    course.enrolledStudents.push(userId);
    await course.save();
  }

  const user = await User.findById(userId);
  if (user && !user.enrolledCourses.includes(course._id)) {
    user.enrolledCourses.push(course._id);
    await user.save();
  }
};

// @desc    Create Razorpay order for a course purchase
// @route   POST /api/payments/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return sendError(res, "Course ID is required", 400);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, "Course not found", 404);
    }

    if (course.price === 0) {
      return sendError(res, "This course is free. Enroll directly.", 400);
    }

    if (course.enrolledStudents.includes(req.user._id)) {
      return sendError(res, "You are already enrolled in this course", 400);
    }

    const amountInPaise = Math.round(course.price * 100);
    const currency = process.env.RAZORPAY_CURRENCY || "INR";
    const receipt = `course_${course._id.toString().slice(-8)}_${Date.now()}`;

    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes: {
        courseId: course._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    return sendSuccess(
      res,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: RAZORPAY_KEY_ID,
        course: {
          id: course._id,
          title: course.title,
          description: course.description,
        },
        user: {
          name: req.user.name,
          email: req.user.email,
        },
      },
      "Razorpay order created"
    );
  } catch (error) {
    if (error.message === "Razorpay keys are not configured") {
      return sendError(res, error.message, 500);
    }

    console.error("Razorpay order creation failed:", error);
    return sendError(res, "Unable to create payment order", 500, error.message);
  }
};

// @desc    Verify Razorpay payment and enroll user
// @route   POST /api/payments/verify
// @access  Private
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
      return sendError(res, "Incomplete payment details provided", 400);
    }

    ensureRazorpayConfigured();

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return sendError(res, "Payment verification failed", 400);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, "Course not found", 404);
    }

    await enrollUserInCourse(req.user._id, course);

    return sendSuccess(
      res,
      {
        courseId: course._id,
        paymentId: razorpay_payment_id,
      },
      "Payment verified and enrollment completed"
    );
  } catch (error) {
    if (error.message === "Razorpay keys are not configured") {
      return sendError(res, error.message, 500);
    }

    console.error("Razorpay verification failed:", error);
    return sendError(res, "Unable to verify payment", 500, error.message);
  }
};
