const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    // Keep both fields but make them work together
    gameId: {
      type: String,
      trim: true,
      // This can be auto-generated or same as gameApiID
    },
    uniqueId: {
      type: String,
    },
    gameApiID: {
      type: String,
      required: true,
      trim: true,
      // Not unique alone since it can be same with different providers
    },
    provider: {
      type: String,
      trim: true,
      required: true,
    },
    // Updated category field to support multiple categories
    category: {
      type: [String], // Changed to array of strings
      trim: true,
      required: true,
      validate: {
        validator: function(categories) {
          // Ensure at least one category is provided
          return Array.isArray(categories) && categories.length > 0;
        },
        message: "Game must belong to at least one category"
      }
    },
    portraitImage: {
      type: String,
      required: true,
    },
    landscapeImage: {
      type: String,
      required: true,
    },
    defaultImage: {
      type: String,
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    fullScreen: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound unique index for gameApiID + provider combination
gameSchema.index({ gameApiID: 1, provider: 1 }, { unique: true });

// Regular indexes for query performance
gameSchema.index({ provider: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ featured: 1 });
gameSchema.index({ category: 1 }); // Index for array field for efficient queries

// Pre-save middleware to handle gameId
gameSchema.pre('save', function(next) {
  // Set gameId to gameApiID if not provided
  if (!this.gameId && this.gameApiID) {
    this.gameId = this.gameApiID;
  }
  
  // Ensure category is an array
  if (typeof this.category === 'string') {
    this.category = [this.category];
  }
  
  next();
});

// Helper method to add a category
gameSchema.methods.addCategory = function(category) {
  if (!this.category.includes(category)) {
    this.category.push(category);
    return true;
  }
  return false;
};

// Helper method to remove a category
gameSchema.methods.removeCategory = function(category) {
  const index = this.category.indexOf(category);
  if (index > -1) {
    this.category.splice(index, 1);
    return true;
  }
  return false;
};

// Helper method to check if game has a category
gameSchema.methods.hasCategory = function(category) {
  return this.category.includes(category);
};

// Static method to find games by multiple categories
gameSchema.statics.findByCategories = function(categories, options = {}) {
  const query = { category: { $in: categories } };
  if (options.status !== undefined) query.status = options.status;
  if (options.featured !== undefined) query.featured = options.featured;
  
  return this.find(query)
    .sort(options.sort || { order: 1, createdAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

// Static method to find games that match all specified categories
gameSchema.statics.findByAllCategories = function(categories, options = {}) {
  const query = { category: { $all: categories } };
  if (options.status !== undefined) query.status = options.status;
  if (options.featured !== undefined) query.featured = options.featured;
  
  return this.find(query)
    .sort(options.sort || { order: 1, createdAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

// Drop any existing problematic indexes on application startup
gameSchema.statics.ensureIndexes = async function() {
  try {
    const collection = this.collection;
    const indexes = await collection.indexes();
    
    // Drop the problematic gameId_1 index if it exists
    const gameIdIndex = indexes.find(idx => idx.name === 'gameId_1');
    if (gameIdIndex) {
      console.log('Dropping existing gameId_1 index...');
      await collection.dropIndex('gameId_1');
      console.log('Successfully dropped gameId_1 index');
    }
    
    // Drop the problematic paymentId_1 index if it exists
    const paymentIdIndex = indexes.find(idx => idx.name === 'paymentId_1');
    if (paymentIdIndex) {
      console.log('Dropping existing paymentId_1 index...');
      await collection.dropIndex('paymentId_1');
      console.log('Successfully dropped paymentId_1 index');
    }
    
    // Drop any unique index on gameApiID alone if it exists
    const gameApiIdIndex = indexes.find(idx => 
      idx.name === 'gameApiID_1' && idx.unique === true
    );
    if (gameApiIdIndex) {
      console.log('Dropping unique index on gameApiID...');
      await collection.dropIndex('gameApiID_1');
    }
    
    console.log('Index cleanup completed');
  } catch (error) {
    console.error('Error during index cleanup:', error);
  }
};

const Game = mongoose.model("Game", gameSchema);

// Call this when your app starts
Game.ensureIndexes().catch(console.error);

module.exports = Game;