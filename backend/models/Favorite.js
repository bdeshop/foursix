const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    // Store game snapshot at time of favoriting (in case game details change later)
    gameSnapshot: {
      name: { type: String, required: true },
      gameApiID: { type: String, required: true },
      provider: { type: String, required: true },
      portraitImage: { type: String, required: true },
      landscapeImage: { type: String, required: true },
      defaultImage: { type: String, default: null },
      category: { type: [String], default: [] },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // For analytics - track when user last played this favorite game
    lastPlayedAt: {
      type: Date,
      default: null,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    // Custom order for user's favorite list
    customOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate favorites
favoriteSchema.index({ userId: 1, gameId: 1 }, { unique: true });

// Index for sorting by custom order
favoriteSchema.index({ userId: 1, customOrder: 1 });

// Index for recently added favorites
favoriteSchema.index({ userId: 1, createdAt: -1 });

// Index for most played favorites
favoriteSchema.index({ userId: 1, playCount: -1 });

// Static method to get user's favorites with game details
favoriteSchema.statics.getUserFavorites = async function (userId, options = {}) {
  const { 
    limit = 50, 
    skip = 0, 
    sortBy = "customOrder", // customOrder, createdAt, playCount, lastPlayedAt
    sortOrder = "asc" // asc or desc
  } = options;

  let sortField = {};
  switch (sortBy) {
    case "customOrder":
      sortField = { customOrder: sortOrder === "asc" ? 1 : -1 };
      break;
    case "createdAt":
      sortField = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
    case "playCount":
      sortField = { playCount: sortOrder === "asc" ? 1 : -1 };
      break;
    case "lastPlayedAt":
      sortField = { lastPlayedAt: sortOrder === "asc" ? 1 : -1 };
      break;
    default:
      sortField = { customOrder: 1 };
  }

  const favorites = await this.find({ userId })
    .sort(sortField)
    .skip(skip)
    .limit(limit)
    .populate("gameId");

  return favorites;
};

// Static method to check if a game is favorited
favoriteSchema.statics.isFavorited = async function (userId, gameId) {
  const favorite = await this.findOne({ userId, gameId });
  return !!favorite;
};

// Static method to get favorite count for a game
favoriteSchema.statics.getFavoriteCount = async function (gameId) {
  return await this.countDocuments({ gameId });
};

// Instance method to update play stats
favoriteSchema.methods.recordPlay = async function () {
  this.playCount = (this.playCount || 0) + 1;
  this.lastPlayedAt = new Date();
  await this.save();
  return this;
};

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;