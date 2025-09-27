const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js")
// playerMove.js
module.exports = {
    event: "playerMove",
    run: async (client, player, oldChannelId, newChannelId) => {
        updateMelodyBoardPanel(player.guildId,client)
    }
};
