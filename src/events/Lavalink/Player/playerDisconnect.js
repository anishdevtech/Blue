const update = require("../../../Functions/Melody/updateMelodyBoardPanel.js")
// playerDisconnect.js
module.exports = {
    event: "playerDisconnect",
    run: async (client, player, voiceChannelId) => {
        updateMelodyBoardPanel(player.guildId,client)
    }
};
