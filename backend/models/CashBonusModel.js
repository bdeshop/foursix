const mongoose = require("mongoose");

const CashBonusSchema = new mongoose.Schema(
  {
    // Core Fields
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // Expiry
    expiresAt: {
      type: Date,
      default: null
    },
    
    // No Expiry Option
    noExpiry: {
      type: Boolean,
      default: false
    },
    
    // Bonus Status (Overall)
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active"
    },

    // Bonus Type
    bonusType: {
      type: String,
      default: "special_event"
    },

    // Multi-User Support with individual status
    users: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      status: {
        type: String,
        enum: ["unclaimed", "claimed"],
        default: "unclaimed"
      },
      claimedAt: Date
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
CashBonusSchema.index({ status: 1 });
CashBonusSchema.index({ expiresAt: 1 });
CashBonusSchema.index({ "users.userId": 1 });
CashBonusSchema.index({ "users.status": 1 });

// Auto-expire bonus (only if noExpiry is false and expiresAt is set)
CashBonusSchema.pre("save", function(next) {
  if (!this.noExpiry && this.status === "active" && this.expiresAt && new Date() > this.expiresAt) {
    this.status = "expired";
  }
  next();
});

// Method to claim bonus
CashBonusSchema.methods.claim = async function(userId) {
  const userBonus = this.users.find(u => u.userId.toString() === userId.toString());
  
  if (!userBonus) {
    throw new Error("User not assigned to this bonus");
  }
  
  if (userBonus.status !== "unclaimed") {
    throw new Error("Bonus already claimed");
  }
  
  if (this.status !== "active") {
    throw new Error("Bonus is not active");
  }
  
  // Check expiry only if not noExpiry
  if (!this.noExpiry && this.expiresAt && new Date() > this.expiresAt) {
    this.status = "expired";
    await this.save();
    throw new Error("Bonus has expired");
  }
  
  userBonus.status = "claimed";
  userBonus.claimedAt = new Date();
  
  await this.save();
  return userBonus;
};

// Virtual field to check if bonus has expiry
CashBonusSchema.virtual("hasExpiry").get(function() {
  return !this.noExpiry && this.expiresAt !== null;
});

// Virtual field to check if bonus is expired (only for non-noExpiry bonuses)
CashBonusSchema.virtual("isExpired").get(function() {
  if (this.noExpiry) return false;
  return this.expiresAt && new Date() > this.expiresAt;
});

module.exports = mongoose.model("CashBonus", CashBonusSchema);