// models/OpaySettings.js
const mongoose = require('mongoose');

const opaySettingsSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    default: ''
  },
  running: {
    type: Boolean,
    default: false
  },
  lastValidation: {
    type: Object,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one document exists
opaySettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('OpaySettings', opaySettingsSchema);