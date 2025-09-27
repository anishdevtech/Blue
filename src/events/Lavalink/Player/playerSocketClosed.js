const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js");
// playerSocketClosed.js
module.exports = {
    event: "playerSocketClosed",
    run: async (client, player, payload) => {
        updateMelodyBoardPanel(player.guildId, client);
    }
};
