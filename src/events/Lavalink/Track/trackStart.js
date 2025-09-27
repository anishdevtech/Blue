const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const MelodyBoard = require("../../../schemas/MelodyBoard");
const sendMelodyBoardPanel = require("../../../Functions/MelodyBoardFunction.js");
const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js");

function getThumbnail(track) {
    if (track?.info?.artworkUrl) return track.info.artworkUrl;
    if (track?.info?.uri && track.info.uri.includes("youtube.com/watch?v=")) {
        const id = track.info.uri.split("v=")[14]?.split("&");
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

        if (isMelodyBoard) {
            const channel = client.channels.cache.get(mb.channelId);

            let mainMsg = null;
            try {
                mainMsg = await channel.messages.fetch(mb.panelMessageId);
            } catch {
                const msgs = await channel.messages.fetch({ limit: 100 });
                await Promise.all(msgs.map(m => m.delete().catch(() => {})));
                const panel = await sendMelodyBoardPanel(
                    channel.guild,
                    channel,
                    client
                );
                await updateMelodyBoardPanel(player.guildId, client);
                return;
            }
            await updateMelodyBoardPanel(player.guildId, client);
            return;
        }
        if (player.textChannelId === mb?.channelId) return false;

        const channel = client.channels.cache.get(player.textChannelId);
        if (!channel || !channel.send) return;

        const title = track?.info?.title || "Unknown Title";
        const uri = track?.info?.uri || "";
        const author = track?.info?.author || "Unknown Artist";
        const durationMs = track?.info?.length ?? track?.info?.duration ?? 0;
        const requester = track.requester;
        const thumbnail = getThumbnail(track);

        // Components: use emoji IDs only
        const queueBtn = new ButtonBuilder()
            .setCustomId(`music_queue_${player.guildId}`)
            .setLabel("Queue")
            .setStyle(ButtonStyle.Primary)
            .setEmoji(client.emojiid.queue);

        const addBtn = new ButtonBuilder()
            .setCustomId(`music_add_${player.guildId}`)
            .setLabel("Add")
            .setStyle(ButtonStyle.Success)
            .setEmoji(client.emojiid.addsong);

        const skipBtn = new ButtonBuilder()
            .setCustomId(`music_skip_${player.guildId}`)
            .setLabel("Skip")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client.emojiid.forward);

        const pauseBtn = new ButtonBuilder()
            .setCustomId(`music_pause_${player.guildId}`)
            .setLabel("Pause/Resume")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client.emojiid.pause);

        const stopBtn = new ButtonBuilder()
            .setCustomId(`music_stop_${player.guildId}`)
            .setLabel("Stop")
            .setStyle(ButtonStyle.Danger)
            .setEmoji(client.emojiid.stop2);

        const row = new ActionRowBuilder().addComponents(
            queueBtn,
            addBtn,
            skipBtn,
            pauseBtn,
            stopBtn
        );
        // console.log(player);
        // Embeds: use emoji strings only
        const imageEmbed = new EmbedBuilder()
            .setColor("#2b6cb0")
            .setTitle(`${client.emoji.music} **Now Playing**`)
            .setDescription(uri ? `# *** [${title}](${uri}) ***` : title);
        const SettingsEmbed = new EmbedBuilder()
            .setColor("#2b6cb0")
            .setTitle(`<a:music:1412953973958250537> ***Player Information*** `)
            .addFields(
                {
                    name: `> <:loop:1412963346679861258> **RepeatMode**`,
                    value: `> ${player.repeatMode}`,
                    inline: true
                },
                {
                    name: `> <a:wifi:1412964171259183216> **Ping**`,
                    value: `> *${player.ping.lavalink}*ms`,
                    inline: true
                },
                {
                    name: `> <:volumeup:1412965430573662398> **Volume**`,
                    value: `> *_${player.volume}%_*`,
                    inline: true
                },
                {
                    name: `> <a:server:1412965953980862568> **Node**`,
                    value: `> *${player.node.options.id}*`,
                    inline: true
                }
            );

        const embed = new EmbedBuilder()
            .setColor("#2b6cb0")
            .setTitle("<:queue:1039353416260005988> ***Track Information***")
            .addFields(
                {
                    name: `> ${client.emoji.person}**Artist**`,
                    value: `> _*${author}*_`,
                    inline: true
                },
                {
                    name: `> ${client.emoji.duration} **Duration**`,
                    value: `> *${formatMs(durationMs)}*`,
                    inline: true
                },

                {
                    name: `> ${client.emoji.owner} **Requested By**`,
                    value:
                        requester && requester.id
                            ? `>  <@${requester.id}>`
                            : "> Unknown",
                    inline: true
                },
                {
                    name: `> <:hash:1412943072190398514> **Connected In:**`,
                    value: `> <#${player.voiceChannelId}>`,
                    inline: true
                }
            );
        if (thumbnail) imageEmbed.setThumbnail(thumbnail);

        const msg = await channel.send({
            embeds: [imageEmbed, embed, SettingsEmbed],
            components: [row]
        });
        global.lastNowPlaying.set(player.guildId, {
            channelId: msg.channel.id,
            messageId: msg.id
        });
    }
};
