const { Schema, model } = require('mongoose');

const warningLimitsSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    kickLimit: { type: Number, default: 5 },
    banLimit: { type: Number, default: 10 },
    exemptRoles: { type: [String], default: [] },// Array of role IDs that are exempt
    approvalchannel:{type:Number, default:null}
    
});

module.exports = model('WarningLimit', warningLimitsSchema);
