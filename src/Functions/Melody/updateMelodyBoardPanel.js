const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const MelodyBoard = require("../../schemas/MelodyBoard"); // adjust path
const { disableAllButtonsFromMsg } = require("../../Functions/Utility.js");
function formatMs(ms) {
    if (!ms || ms < 0) return "0:00";
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
}

function getControlRows(guildId) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mb_playpause_${guildId}`)
                .setStyle(ButtonStyle.Primary)
                .setLabel("Play/Pause")
                .setEmoji("⏯️"),
            new ButtonBuilder()
                .setCustomId(`mb_skip_${guildId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Skip")
                .setEmoji("⏭️"),
            new ButtonBuilder()
                .setCustomId(`mb_prev_${guildId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Previous")
                .setEmoji("⏮️"),
            new ButtonBuilder()
                .setCustomId(`mb_stop_${guildId}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Stop")
                .setEmoji("⏹️"),
            new ButtonBuilder()
                .setCustomId(`mb_shuffle_${guildId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Shuffle")
                .setEmoji("🔀")
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mb_vol_down_${guildId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Vol -")
                .setEmoji("🔉"),
            new ButtonBuilder()
                .setCustomId(`mb_vol_up_${guildId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Vol +")
                .setEmoji("🔊"),
            new ButtonBuilder()
                .setCustomId(`mb_mute_${guildId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Mute")
                .setEmoji("🔇"),
            new ButtonBuilder()
                .setCustomId(`mb_repeat_${guildId}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Repeat")
                .setEmoji("🔁"),
            new ButtonBuilder()
                .setCustomId(`mb_queue_refresh_${guildId}`)
                .setStyle(ButtonStyle.Primary)
                .setLabel("Refresh Queue")
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mb_add_song_${guildId}`)
                .setStyle(ButtonStyle.Success)
                .setLabel("Add Song")
                .setEmoji("➕"),
            new ButtonBuilder()
                .setCustomId(`mb_add_playlist_${guildId}`)
                .setStyle(ButtonStyle.Success)
                .setLabel("Add Playlist")
                .setEmoji("🎶")
        )
    ];
}

/**
 * Updates the MelodyBoard panel to show current Now Playing, Queue, and controls.
 * @param {string} guildId
 * @param {Client} client
 */
async function updateMelodyBoardPanel(guildId, client) {
    // Get MelodyBoard config (channel, panel msg)
    const mb = await MelodyBoard.findOne({ guildId });
    if (!mb || !mb.channelId || !mb.panelMessageId) return;

    // Fetch the channel and message
    const channel = client.channels.cache.get(mb.channelId);
    if (!channel) return;
    let msg;
    try {
        msg = await channel.messages.fetch(mb.panelMessageId);
    } catch {
        return;
    }

    // Get player
    const player = await client.lavalink.players.get(guildId);

    // NOW PLAYING EMBED
    let nowPlayingEmbed;
    if (player && player.queue.current) {
        const track = player.queue.current;
        nowPlayingEmbed = new EmbedBuilder()
            .setTitle("🎶 Now Playing")
            .setDescription(`[${track.info.title}](${track.info.uri})`)
            .setColor("#2b6cb0")
            .addFields(
                {
                    name: "<:search:1413276769347440762> Artist",
                    value: track.info.author || "Unknown",
                    inline: true
                },
                {
                    name: "<:discotoolsxyzicon65:1413276664758009998> Duration",
                    value: formatMs(track.info.length),
                    inline: true
                },
                {
                    name: "<:youtube:1413276648777715733> Source",
                    value:
                        track.info.sourceName?.replace(/^\w/, c =>
                            c.toUpperCase()
                        ) || "Unknown",
                    inline: true
                },
                {
                    name: "<:links:1413276811067920516> Track ID",
                    value: track.info.identifier || "Unknown",
                    inline: true
                },
                ...(track.requestedBy
                    ? [
                          {
                              name: "<:founder:1413277464326836254> Requested By",
                              value: `<@${track.requestedBy.id}>`,
                              inline: true
                          }
                      ]
                    : []),
                ...(track.info.isrc
                    ? [
                          {
                              name: "🔖 ISRC",
                              value: track.info.isrc,
                              inline: true
                          }
                      ]
                    : [])
            )
            .setFooter({
                text: `Volume: ${player?.volume ?? "N/A"} | ${
                    player?.queue?.tracks?.length
                        ? player.queue.tracks.length + " in queue"
                        : "No queue"
                }`
            })
            .setTimestamp();

        // Add big image (if artwork), else fallback to video/large preview
        if (track.info.artworkUrl) {
            nowPlayingEmbed.setThumbnail(track.info.artworkUrl);
            nowPlayingEmbed.setImage(track.info.artworkUrl); // For square or high-res thumbs, looks sharp
        } else if (
            track.info.uri &&
            track.info.sourceName?.toLowerCase().includes("youtube")
        ) {
            // Try to extract a YouTube ID and use the large preview
            const ytID = track.info.identifier;
            if (ytID)
                nowPlayingEmbed.setImage(
                    `https://i.ytimg.com/vi/${ytID}/maxresdefault.jpg`
                );
        }
    } else {
        nowPlayingEmbed = new EmbedBuilder()
            .setTitle("🎶 Now Playing")
            .setDescription("*Nothing is playing yet!*")
            .setColor("#2b6cb0");
    }

    // QUEUE EMBED
    let queueDesc = "*No songs in queue*";
    const tracks = player?.queue?.tracks || [];

    if (tracks.length) {
        queueDesc = tracks
            .slice(0, 10)
            .map(
                (t, i) =>
                    `${i + 1}. [${t.info.title}](${t.info.uri}) (${formatMs(
                        t.info.length
                    )})`
            )
            .join("\n");
        if (tracks.length > 10)
            queueDesc += `\n...and ${tracks.length - 10} more.`;
    }
    const queueEmbed = new EmbedBuilder()
        .setTitle("🎵 Queue")
        .setDescription(queueDesc)
        .setColor("#5cb7f7");

    // EDIT THE PANEL MESSAGE
    await msg.edit({
        embeds: [nowPlayingEmbed, queueEmbed],
        components: getControlRows(guildId)
    });
    if (!player) {
        disableAllButtonsFromMsg(msg, [
            `mb_queue_refresh_${guildId}`,
            `mb_add_song_${guildId}`,
            `mb_add_playlist_${guildId}`
        ]);
    }
}

module.exports = updateMelodyBoardPanel;
