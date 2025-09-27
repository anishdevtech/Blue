const mongoose = require('mongoose');

const ticketPanelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    adminRole: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('TicketPanel', ticketPanelSchema);
