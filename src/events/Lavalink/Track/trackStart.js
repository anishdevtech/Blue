const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const MelodyBoard = require("../../../schemas/MelodyBoard"); // adjust path
const sendMelodyBoardPanel = require("../../../Functions/MelodyBoardFunction.js"); // adjust path
const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js"); // adjust path

function getThumbnail(track) {
    if (track?.info?.artworkUrl) return track.info.artworkUrl;
    if (track?.info?.uri && track.info.uri.includes("youtube.com/watch?v=")) {
        const id = track.info.uri.split("v=")[1]?.split("&")[0];
        if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
    return null;
}
function formatMs(ms) {
    if (!ms || ms < 0) return "0:00";
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
}

module.exports = {
    event: "trackStart",
    run: async (client, player, track) => {
        const mb = await MelodyBoard.findOne({ guildId: player.guildId });
      
        const isMelodyBoard =
            mb &&
            mb.channelId &&
            mb.panelMessageId &&
            player.textChannelId === mb.channelId;

        // If using MelodyBoard
        if (isMelodyBoard) {
            const channel = client.channels.cache.get(mb.channelId);

            // Try fetch the panel; if missing recreate
            let mainMsg = null;
            try {
                mainMsg = await channel.messages.fetch(mb.panelMessageId);
            } catch {
                // Panel missing, wipe channel, recreate
                const msgs = await channel.messages.fetch({ limit: 100 });
                await Promise.all(msgs.map(m => m.delete().catch(() => {})));
                const panel = await sendMelodyBoardPanel(
                    channel.guild,
                    channel,
                    client
                );
                // Optional: update with current song (can call updateMelodyBoardPanel here)
                await updateMelodyBoardPanel(player.guildId, client);
                return;
            }
            // Update the panel
            await updateMelodyBoardPanel(player.guildId, client);
            return; // No normal message sent!
        }

        // Fallback: For non-MelodyBoard channels, send legacy Now Playing message
        const channel = client.channels.cache.get(player.textChannelId);
        if (!channel || !channel.send) return;

        const title = track?.info?.title || "Unknown Title";
        const uri = track?.info?.uri || "";
        const author = track?.info?.author || "Unknown Artist";
        const durationMs = track?.info?.length ?? track?.info?.duration ?? 0;
        const requester = track.requestedBy;
        const thumbnail = getThumbnail(track);

        // Compose embed & controls (as before)
        const queueBtn = new ButtonBuilder()
            .setCustomId(`music_queue_${player.guildId}`)
            .setLabel("Queue")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("📄");

        const addBtn = new ButtonBuilder()
            .setCustomId(`music_add_${player.guildId}`)
            .setLabel("Add")
            .setStyle(ButtonStyle.Success)
            .setEmoji("➕");

        const skipBtn = new ButtonBuilder()
            .setCustomId(`music_skip_${player.guildId}`)
            .setLabel("Skip")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⏭️");

        const pauseBtn = new ButtonBuilder()
            .setCustomId(`music_pause_${player.guildId}`)
            .setLabel("Pause/Resume")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⏸️");

        const stopBtn = new ButtonBuilder()
            .setCustomId(`music_stop_${player.guildId}`)
            .setLabel("Stop")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("⏹️");

        const row = new ActionRowBuilder().addComponents(
            queueBtn,
            addBtn,
            skipBtn,
            pauseBtn,
            stopBtn
        );

        const embed = new EmbedBuilder()
            .setColor("#2b6cb0")
            .setTitle("🎶 Now Playing")
            .setDescription(uri ? `[${title}](${uri})` : title)
            .addFields(
                { name: "🎼 Artist", value: author, inline: true },
                {
                    name: "⏳ Duration",
                    value: formatMs(durationMs),
                    inline: true
                },
                {
                    name: "👤 Requested By",
                    value:
                        requester && requester.id
                            ? `<@${requester.id}>`
                            : "Unknown",
                    inline: true
                }
            );
        if (thumbnail) embed.setThumbnail(thumbnail);

        // Send normal message & controls
        const msg = await channel.send({ embeds: [embed], components: [row] });
        global.lastNowPlaying.set(player.guildId, {
            channelId: msg.channel.id,
            messageId: msg.id
        });
    }
};
