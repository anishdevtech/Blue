module.exports=client=>{

const Warning = require('../schemas/warningSchemas.js');

// Function to remove expired warnings
async function removeExpiredWarnings() {
    const currentTimestamp = new Date();
    try {
        // Find warnings with expiresAt less than current time
        const expiredWarnings = await Warning.find({ 'warnings.expiresAt': { $lt: currentTimestamp } });
        
        // Remove expired warnings from the database
        for (const warning of expiredWarnings) {
            warning.warnings = warning.warnings.filter(w => w.expiresAt >= currentTimestamp);
            await warning.save();
        }
    } catch (err) {
        console.error('Error removing expired warnings:', err);
    }
}

// Schedule the function to run every 5mins (adjust as needed)
setInterval(removeExpiredWarnings, 5 * 60 * 1000); // Runs every 5min
};