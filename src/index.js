require('dotenv').config();
const ExtendedClient = require('./class/ExtendedClient');
//This is for storing track msg log 
if (!global.lastNowPlaying) global.lastNowPlaying = new Map();
const client = new ExtendedClient();

client.start();

// Handles errors and avoids crashes, better to not remove them.
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);