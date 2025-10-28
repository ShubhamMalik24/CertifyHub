const Stripe = require("stripe");
const Course = require("../models/Course");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create checkout session
// @route   POST /api/payments/checkout/:courseId
// @access  Private
exports.createCheckoutSession = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.price === 0) {
      return res.status(400).json({ message: "This course is free" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: course.price * 100, // convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        courseId: course._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Payment error", error: err.message });
  }
};

// @desc    Webhook for Stripe events (enroll user after payment)
// @route   POST /api/payments/webhook
// @access  Public (Stripe calls this endpoint)
exports.stripeWebhook = async (req, res) => {
  let event;

  try {
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const courseId = session.metadata.courseId;
      const userId = session.metadata.userId;

      const course = await Course.findById(courseId);
      if (course && !course.enrolledStudents.includes(userId)) {
        course.enrolledStudents.push(userId);
        await course.save();
      }
    } catch (err) {
      console.error("Error enrolling user after payment:", err.message);
    }
  }

  res.json({ received: true });
};
