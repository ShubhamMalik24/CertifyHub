const express = require("express");
const { createCheckoutSession, stripeWebhook } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Create checkout session
router.post("/checkout/:courseId", protect, createCheckoutSession);

// Stripe webhook (must be raw body)
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

module.exports = router;
