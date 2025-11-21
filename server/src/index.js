const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");

try {
  dotenv.config();
  console.log("✅ .env loaded");
} catch (err) {
  console.error("❌ Error loading .env:", err);
}

const app = express();

const initServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

initServer();




app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const path = require('path');
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, '../uploads', req.path);
  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } else if (req.path.endsWith('.doc') || req.path.endsWith('.docx')) {
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Type', 'application/msword');
    res.sendFile(filePath);
  } else if (req.path.endsWith('.pages')) {
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Type', 'application/vnd.apple.pages');
    res.sendFile(filePath);
  } else {
    express.static('uploads')(req, res, next);
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/assignments", require("./routes/assignments"));
app.use("/api/quizzes", require("./routes/quizzes"));
app.use("/api/certificates", require("./routes/certificates"));
app.use("/api/payments", require("./routes/payments"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/", (req, res) => {
  res.send("CertifyHub Backend Running 🚀");
});



