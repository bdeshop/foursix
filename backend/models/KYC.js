const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['nid', 'passport', 'driving_license', 'birth_certificate'],
    required: true
  },
  documentFront: {
    type: String,
    required: true
  },
  documentBack: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'assigned'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000)
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
kycSchema.index({ userId: 1, status: 1 });
kycSchema.index({ assignedTo: 1, status: 1 });
kycSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('KYC', kycSchema);