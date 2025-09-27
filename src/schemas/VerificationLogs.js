const mongoose = require("mongoose")
modules.export = new mongoose.Schema({
  guildId: String,
  userId: String,
  username: String,
  action: { type: String, enum: ['SUCCESS', 'FAILED', 'ERROR', 'TIMEOUT', 'SPAM'] },
  method: { type: String, enum: ['button', 'captcha'] },
  details: String,
  ip: String,
  timestamp: { type: Date, default: Date.now },
  attempts: { type: Number, default: 1 }
});
