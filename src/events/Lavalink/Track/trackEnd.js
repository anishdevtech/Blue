// events/trackEnd.js
const { EmbedBuilder } = require("discord.js");
const { buildPlayAgainRow } = require("../../../Functions/PlayAgain.js");

const MelodyBoard = require("../../../schemas/MelodyBoard");
// Ensure this map is seeded elsewhere where you set now playing
if (!global.lastNowPlaying) global.lastNowPlaying = new Map();

module.exports = {
    event: "trackEnd",
    run: async (client, player, track) => {
        try {  const mb = await MelodyBoard.findOne({ guildId: player.guildId });

        const isMelodyBoard =
            mb &&
            mb.channelId &&
            mb.panelMessageId &&
            player.textChannelId === mb.channelId;
            if(isMelodyBoard)return false;

            const msgMeta = global.lastNowPlaying.get(player.guildId);
            if (!msgMeta) return;
            const channel = client.channels.cache.get(msgMeta.channelId);
            if (!channel) return;

            let msg;
            try {
                msg = await channel.messages.fetch(msgMeta.messageId);
            } catch {
                return;
            }

            const identifier = track?.info?.identifier || "unknown";

            await msg.edit({
                components: [buildPlayAgainRow(player.guildId, identifier)] // replace all prior controls
            });
        } catch (e) {
            console.error(e);
        }
    }
};
