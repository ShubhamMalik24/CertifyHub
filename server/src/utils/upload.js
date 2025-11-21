const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Get allowed file types from request (can be set by assignment configuration)
  const allowedTypes = req.allowedFileTypes || ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];

  // Check file extension
  const fileExt = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Enhanced upload middleware with dynamic limits
const createUploadMiddleware = (options = {}) => {
  const {
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedFileTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'],
    fieldName = 'file'
  } = options;

  return multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      // Set allowed types on request for use in filter
      req.allowedFileTypes = allowedFileTypes;
      fileFilter(req, file, cb);
    },
    limits: {
      fileSize: maxFileSize,
      files: 5 // Maximum 5 files per upload
    },
  });
};

// Default upload middleware
const upload = createUploadMiddleware();

// Multiple files upload middleware
const uploadMultiple = createUploadMiddleware({
  fieldName: 'files',
  maxFileSize: 100 * 1024 * 1024 // 100MB for multiple files
});

// Multiple fields upload middleware
const uploadFields = (fields) => {
  const fieldsMiddleware = createUploadMiddleware({
    maxFileSize: 50 * 1024 * 1024, // 50MB for multiple files
    allowedFileTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']
  });

  return fieldsMiddleware.fields(fields);
};

// Assignment-specific upload middleware
const assignmentUploadMiddleware = createUploadMiddleware({
  maxFileSize: 10 * 1024 * 1024, // 10MB for assignments
  allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png']
});

const uploadAssignment = assignmentUploadMiddleware.single('file');

module.exports = {
  upload,
  uploadMultiple,
  uploadFields,
  uploadAssignment,
  createUploadMiddleware
};
