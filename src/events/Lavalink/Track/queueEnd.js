const update = require("../../../Functions/Melody/updateMelodyBoardPanel.js")
module.exports = {
  event: "queueEnd",
  run: async (client, player) => {
    const channel = client.channels.cache.get(player.textChannelId);
    if (channel && channel.send) {
      updateMelodyBoardPanel(player.guildId,client)
    }
  }
};
