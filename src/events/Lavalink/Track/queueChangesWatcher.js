// events/Lavalink/queueChangesWatcher.js
const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js")
module.exports = {
  event: "queueChangesWatcher",
  run(client, eventData) {
    const { type, guildId, tracks, position, oldStoredQueue, newStoredQueue } = eventData;
updateMelodyBoardPanel(guildId,client)
  }
};
