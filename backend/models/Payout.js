const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  affiliate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Affiliate',
    required: true
  },
  
  payoutId: {
    type: String,
    unique: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
  },
  
  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'binance'],
    required: true
  },
  
  paymentDetails: {
    type: String,
    required: true
  },
  
  notes: {
    type: String
  },
  
  netAmount: {
    type: Number
  },
  
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate payout ID
payoutSchema.pre('save', function(next) {
  if (!this.payoutId) {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.payoutId = `PO${Date.now().toString().slice(-6)}${random}`;
  }
  
  // Set net amount same as amount (no fees for now)
  if (!this.netAmount) {
    this.netAmount = this.amount;
  }
  
  next();
});

module.exports = mongoose.model('Payout', payoutSchema);