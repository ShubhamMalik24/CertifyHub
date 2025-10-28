const express = require("express");
const router = express.Router();
const {
  generateCertificate,
  getCertificatesForStudent,
  markCourseComplete,
  getCertificate,
  downloadCertificate,
} = require("../controllers/certificateController");
const { protect } = require("../middleware/auth");

router.route("/generate").post(protect, generateCertificate);
router.route("/student/:studentId").get(protect, getCertificatesForStudent);

// Course completion and certificate generation
router.route("/admin/courses/:courseId/mark-complete").post(protect, markCourseComplete);
router.route("/courses/:courseId/certificate").get(protect, getCertificate);
router.route("/download/:courseId").get(protect, downloadCertificate);

module.exports = router;
