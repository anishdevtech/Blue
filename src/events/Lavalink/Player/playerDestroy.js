const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js")
// playerDestroy.js
module.exports = {
    event: "playerDestroy",
    run: async (client, player, reason) => {
        updateMelodyBoardPanel(player.guildId,client)
    }
};
