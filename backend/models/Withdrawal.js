const mongoose = require("mongoose");

// Sub-schema for Bank Transfer details
const bankDetailsSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: function() { return this.method === "bank"; }
  },
  accountHolderName: {
    type: String,
    required: function() { return this.method === "bank"; }
  },
  accountNumber: {
    type: String,
    required: function() { return this.method === "bank"; }
  },
  branchName: {
    type: String,
    required: function() { return this.method === "bank"; }
  },
  district: {
    type: String,
    required: function() { return this.method === "bank"; }
  },
  routingNumber: {
    type: String,
    required: function() { return this.method === "bank"; }
  }
});

// Sub-schema for Mobile Banking details (bKash, Rocket, Nagad)
const mobileBankingDetailsSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: function() { 
      return ["bkash", "rocket", "nagad"].includes(this.method); 
    }
  },
  accountType: {
    type: String,
    enum: ["personal", "agent"],
    required: function() { 
      return this.method === "bkash"; 
    }
  }
});

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  method: {
    type: String,
    enum: ["bkash", "rocket", "nagad", "bank"],
    required: true,
  },
  // For mobile banking (bkash, rocket, nagad)
  mobileBankingDetails: {
    type: mobileBankingDetailsSchema,
    default: null
  },
  // For bank transfer
  bankDetails: {
    type: bankDetailsSchema,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  status: {
    type: String,
    default: "pending"
  },
  transactionId: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  adminNote: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ method: 1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);