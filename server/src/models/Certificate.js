const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
      index: true,
    },
    certificateId: {
      type: String,
      required: [true, "Certificate ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      default: function() {
        return 'CERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      },
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    certificateUrl: {
      type: String,
      required: [true, "Certificate URL is required"],
      trim: true,
    },
    grade: {
      type: String,
      enum: ["Pass", "Merit", "Distinction"],
      default: "Pass",
      trim: true,
    },
    overallScore: {
      type: Number,
      min: [0, "Score must be at least 0"],
      max: [100, "Score cannot exceed 100"],
      default: null,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Issuer reference is required"],
    },
    verificationUrl: {
      type: String,
      trim: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revocationReason: {
      type: String,
      default: null,
    },
    metadata: {
      pdfGeneratedAt: Date,
      fileSize: Number,
      version: {
        type: String,
        default: "1.0",
      },
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index to ensure one certificate per student per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

// Index for verification lookups
certificateSchema.index({ certificateId: 1, isRevoked: 1 });

// Virtual for certificate age
certificateSchema.virtual('certificateAge').get(function() {
  const now = new Date();
  const issued = new Date(this.issuedAt);
  const diffTime = Math.abs(now - issued);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for verification status
certificateSchema.virtual('isValid').get(function() {
  return !this.isRevoked && this.certificateUrl;
});

// Static method to find valid certificate
certificateSchema.statics.findValidCertificate = function(certificateId) {
  return this.findOne({ 
    certificateId: certificateId.toUpperCase(), 
    isRevoked: false 
  })
  .populate('student', 'name email')
  .populate('course', 'title')
  .populate('issuedBy', 'name');
};

// Instance method to revoke certificate
certificateSchema.methods.revoke = function(userId, reason) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedBy = userId;
  this.revocationReason = reason;
  return this.save();
};

// Pre-save hook to set metadata
certificateSchema.pre('save', function(next) {
  if (this.isNew) {
    this.metadata = {
      ...this.metadata,
      pdfGeneratedAt: new Date(),
      version: "1.0"
    };
  }
  next();
});

module.exports = mongoose.model("Certificate", certificateSchema);
