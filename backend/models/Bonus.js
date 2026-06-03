const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  bonusCode: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  bonusType: {
    type: String,
    enum: ['welcome', 'deposit', 'reload', 'cashback', 'free_spin', 'special', 'manual'],
    default: 'deposit'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  minDeposit: {
    type: Number,
    default: 0
  },
  maxBonus: {
    type: Number,
    default: null
  },
  wageringRequirement: {
    type: Number,
    default: 0
  },
  validityDays: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  applicableTo: {
    type: String,
    enum: ['all', 'new', 'existing'],
    default: 'all'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate bonus code if not provided
bonusSchema.pre('save', function(next) {
  if (!this.bonusCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bonusCode = code;
  }
  next();
});

const Bonus = mongoose.model('Bonus', bonusSchema);

module.exports = Bonus;