// models/OTP.js
const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['phone_verification', 'password_reset', 'login', 'transaction'],
        default: 'phone_verification'
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    },
    verified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // TTL index: automatically delete after 5 minutes
    }
});

// Index for efficient queries
OTPSchema.index({ phone: 1, purpose: 1, verified: 1 });

module.exports = mongoose.model('OTP', OTPSchema);