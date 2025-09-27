const { Schema, model } = require('mongoose');

const warningSchema = new Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    warnings: [
        {
            moderatorId: { type: String, required: true },
            reason: { type: String, default: 'No reason provided' },
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = model('Warning', warningSchema);
