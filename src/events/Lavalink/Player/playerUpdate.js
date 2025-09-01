const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js");
// playerUpdate.js
module.exports = {
    event: "playerUpdate",
    run: async (client, player) => {
       updateMelodyBoardPanel(player.guildId, client);
    }
};
