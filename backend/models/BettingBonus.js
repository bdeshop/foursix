const mongoose = require('mongoose');

const bettingBonusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    bonusType: {
        type: String,
        enum: ['weekly', 'monthly'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    betAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['unclaimed', 'claimed', 'expired'],
        default: 'unclaimed'
    },
    processedBy: {
        type: String,
        required: true
    },
    claimedAt: {
        type: Date,
        default: null
    },
    claimedBy: {
        type: String,
        default: null
    },
    month: {
        type: Number,
        min: 1,
        max: 12
    },
    year: {
        type: Number
    },
    weekNumber: {
        type: Number,
        min: 1,
        max: 52
    },
    distributionDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
bettingBonusSchema.index({ userId: 1, status: 1 });
bettingBonusSchema.index({ bonusType: 1, status: 1 });
bettingBonusSchema.index({ distributionDate: -1 });

module.exports = mongoose.model('BettingBonus', bettingBonusSchema);