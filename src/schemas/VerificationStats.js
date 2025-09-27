const mongoose = require("mongoose");

modules.export = new mongoose.Schema({
  guildId: String,
  totalVerifications: { type: Number, default: 0 },
  successfulVerifications: { type: Number, default: 0 },
  failedVerifications: { type: Number, default: 0 },
  captchaAttempts: { type: Number, default: 0 },
  buttonClicks: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});
