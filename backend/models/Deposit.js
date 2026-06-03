const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'bonus'],
    required: true,
    default: 'deposit'
  },
  method: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  phoneNumber: {
    type: String,
    required: function() {
      return ['bkash', 'nagad', 'rocket', 'upay'].includes(this.method);
    }
  },
  transactionId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Bonus fields
  bonusType: {
    type: String,
    default: 'none',
    enum: ['none', 'first_deposit', 'welcome_bonus', 'reload_bonus', 'special_bonus', 'cashback', 'referral']
  },
  bonusAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  wageringRequirement: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusCode: {
    type: String,
    sparse: true,
    index: true
  },
  
  // User balance before transaction
  playerbalance: {
    type: Number,
    default: 0
  },
  
  // OraclePay Specific Fields
  oraclePaySessionCode: {
    type: String,
    sparse: true,
    index: true,
    unique: true,
    description: "Unique OraclePay session code for this payment"
  },
  userIdentifyAddress: {
    type: String,
    sparse: true,
    index: true,
    description: "User's unique identifier from OraclePay"
  },
  invoiceNumber: {
    type: String,
    sparse: true,
    index: true,
    description: "Invoice number sent to OraclePay"
  },
  checkoutItems: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: "Additional checkout items data returned from OraclePay"
  },
  paymentUrl: {
    type: String,
    description: "OraclePay payment page URL"
  },
  
  // External Payment Fields (for backward compatibility)
  paymentId: {
    type: String,
    sparse: true,
    index: true,
    description: "Payment ID (userIdentifyAddress from OraclePay)"
  },
  externalPaymentId: {
    type: String,
    sparse: true,
    description: "External payment ID"
  },
  externalMethods: {
    type: [String],
    default: []
  },
  
  // Bank/Provider Information
  bank: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'upay', 'bank', 'card', 'oraclepay', null],
    default: null,
    description: "Payment provider used"
  },
  
  // Webhook Response Data
  webhookResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: "Complete webhook response from OraclePay"
  },
  
  // Transaction Metadata
  currency: {
    type: String,
    default: 'BDT'
  },
  rate: {
    type: Number,
    default: 1,
    min: 0
  },
  charge: {
    fixed: { type: Number, default: 0, min: 0 },
    percent: { type: Number, default: 0, min: 0 }
  },
  
  // Security and Tracking
  footprint: {
    type: String,
    description: "Security footprint URL from OraclePay"
  },
  ipAddress: {
    type: String,
    description: "User's IP address at time of transaction"
  },
  userAgent: {
    type: String,
    description: "User's browser/user agent at time of transaction"
  },
  
  // Timestamps
  expiresAt: {
    type: Date,
    description: "When the payment link expires"
  },
  processedAt: {
    type: Date,
    description: "When the transaction was processed"
  },
  completedAt: {
    type: Date,
    description: "When the transaction was completed"
  },
  failedAt: {
    type: Date,
    description: "When the transaction failed"
  },
  
  // Error/Reason tracking
  failureReason: {
    type: String,
    description: "Reason for failure if status is failed"
  },
  
  // Description
  description: {
    type: String,
    default: ''
  }
  
}, {
  timestamps: true
});

// Compound indexes for better query performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, status: 1, type: 1 });
transactionSchema.index({ method: 1, status: 1, createdAt: -1 });
transactionSchema.index({ bonusType: 1, status: 1 });
transactionSchema.index({ bank: 1, status: 1 });

// OraclePay specific indexes
transactionSchema.index({ oraclePaySessionCode: 1 }, { sparse: true, unique: true });
transactionSchema.index({ userIdentifyAddress: 1 }, { sparse: true });
transactionSchema.index({ invoiceNumber: 1 }, { sparse: true });
transactionSchema.index({ transactionId: 1 }, { sparse: true });
transactionSchema.index({ paymentId: 1 }, { sparse: true });
transactionSchema.index({ expiresAt: 1 }, { sparse: true, expireAfterSeconds: 0 });

// Pre-save middleware to set timestamps based on status
transactionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status === 'failed' && !this.failedAt) {
      this.failedAt = new Date();
    } else if (this.status === 'processed' && !this.processedAt) {
      this.processedAt = new Date();
    }
  }
  next();
});

// Virtual for total amount including bonus
transactionSchema.virtual('totalAmount').get(function() {
  return this.amount + (this.bonusAmount || 0);
});

// Virtual for checking if expired
transactionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `৳${this.amount.toFixed(2)}`;
});

// Virtual for formatted total
transactionSchema.virtual('formattedTotal').get(function() {
  return `৳${this.totalAmount.toFixed(2)}`;
});

// Method to check if transaction can be processed
transactionSchema.methods.canBeProcessed = function() {
  return this.status === 'pending' && (!this.expiresAt || new Date() <= this.expiresAt);
};

// Method to mark as completed
transactionSchema.methods.markCompleted = function(transactionId, bank, additionalData = {}) {
  this.status = 'completed';
  this.transactionId = transactionId || this.transactionId;
  this.bank = bank || this.bank;
  this.completedAt = new Date();
  this.processedAt = new Date();
  
  if (additionalData) {
    Object.assign(this, additionalData);
  }
  
  return this.save();
};

// Method to mark as failed
transactionSchema.methods.markFailed = function(reason, additionalData = {}) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failedAt = new Date();
  
  if (additionalData) {
    Object.assign(this, additionalData);
  }
  
  return this.save();
};

// Static method to find by OraclePay session
transactionSchema.statics.findByOraclePaySession = function(sessionCode) {
  return this.findOne({ oraclePaySessionCode: sessionCode });
};

// Static method to find by userIdentifyAddress
transactionSchema.statics.findByUserIdentifyAddress = function(address) {
  return this.findOne({ userIdentifyAddress: address });
};

// Static method to find pending OraclePay transactions
transactionSchema.statics.findPendingOraclePay = function() {
  return this.find({
    oraclePaySessionCode: { $exists: true },
    status: 'pending'
  }).sort({ createdAt: -1 });
};

// Static method to get statistics
transactionSchema.statics.getStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalBonus: { $sum: '$bonusAmount' }
      }
    }
  ]);
  
  return stats;
};

// Ensure indexes are created
transactionSchema.on('index', function(err) {
  if (err) {
    console.error('Error creating Deposit indexes:', err);
  }
});

const Deposit = mongoose.model('Deposit', transactionSchema);

// Create indexes
Deposit.createIndexes().catch(err => {
  console.error('Error creating Deposit indexes:', err);
});

module.exports = Deposit;