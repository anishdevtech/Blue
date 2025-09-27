const mongoose = require('mongoose');

const embedSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  color: { type: String, default: '#0099ff' }, // Hex color code string
  fields: [{
    name: String,
    value: String,
    inline: { type: Boolean, default: false }
  }],
  footer: {
    text: { type: String, default: '' },
    icon_url: { type: String, default: '' }
  },
  timestamp: { type: Boolean, default: false }
}, { _id: false });

const verificationSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },

  verificationChannelId: { type: String, required: true },
  verificationRoleId: { type: String, required: true },

  verificationMethod: { type: String, enum: ['captcha', 'button'], default: 'button' },

  embeds: {
    type: [embedSchema],
    default: [{
      title: 'Verify yourself!',
      description: "Click the button below to get verified.",
      color: '#0099ff',
      timestamp: true,
      footer: { text: 'Verification Bot' }
    }]
  },

  confirmationMessage: {
    type: String,
    default: "Congrats {user.name}, you are now verified in {server.name}!"
  },

  buttonColor: {
    type: String,
    enum: ['Primary', 'Secondary', 'Success', 'Danger'],
    default: 'Primary'
  },

  buttonEmoji: {
    type: String,
    default: '✅'
  },

  active: {
    type: Boolean,
    default: false // Whether verification is currently enabled
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: Date
});

// Pre-save hook to update timestamps
verificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('VerificationConfig', verificationSchema);
