const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const MelodyBoard = require(".././schemas/MelodyBoard"); // adjust path if needed

/**
 * Sends (or creates/updates) the main MelodyBoard panel message in a guild.
 * @param {Guild} guild - discord.js Guild object
 * @param {TextChannel} textChannel - channel to send panel message to
 * @param {Client} client - your Discord client, for cache
 * @returns {Message} the panel message
 */
async function sendMelodyBoardPanel(guild, textChannel, client,NewSetup) {
    // Control rows
    function getRow1(gid) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mb_playpause_${gid}`)
                .setStyle(ButtonStyle.Primary)
                .setLabel("Play/Pause")
                .setEmoji("⏯️"),
            new ButtonBuilder()
                .setCustomId(`mb_skip_${gid}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Skip")
                .setEmoji("⏭️"),
            new ButtonBuilder()
                .setCustomId(`mb_prev_${gid}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Previous")
                .setEmoji("⏮️"),
            new ButtonBuilder()
                .setCustomId(`mb_stop_${gid}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Stop")
                .setEmoji("⏹️"),
            new ButtonBuilder()
                .setCustomId(`mb_shuffle_${gid}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Shuffle")
                .setEmoji("🔀")
        );
    }
    function getRow2(gid) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mb_vol_down_${gid}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Vol -")
                .setEmoji("🔉"),
            new ButtonBuilder()
                .setCustomId(`mb_vol_up_${gid}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Vol +")
                .setEmoji("🔊"),
            new ButtonBuilder()
                .setCustomId(`mb_mute_${gid}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Mute")
                .setEmoji("🔇"),
            new ButtonBuilder()
                .setCustomId(`mb_repeat_${gid}`)
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Repeat")
                .setEmoji("🔁"),
            new ButtonBuilder()
                .setCustomId(`mb_queue_refresh_${gid}`)
                .setStyle(ButtonStyle.Primary)
                .setLabel("Refresh Queue")
        );
    }
    function getRow3(gid) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mb_add_song_${gid}`)
                .setStyle(ButtonStyle.Success)
                .setLabel("Add Song")
                .setEmoji("➕"),
            new ButtonBuilder()
                .setCustomId(`mb_add_playlist_${gid}`)
                .setStyle(ButtonStyle.Success)
                .setLabel("Add Playlist")
                .setEmoji("🎶")
        );
    }
    function nowPlayingEmbed() {
        return new EmbedBuilder()
            .setTitle("🎶 Now Playing")
            .setDescription("*Nothing is playing yet!*")
            .setImage("https://cdn.discordapp.com/attachments/1036448011494101036/1411795349466644592/image0.jpg?ex=68b5f461&is=68b4a2e1&hm=ece8a3ec5cc2f80c7683e8d596cae589a824c702adf24832d060ef8a2fe4114d&")
            .setColor("#2b6cb0");
    }
    function queueEmbed() {
        return new EmbedBuilder()
            .setTitle("🎵 Queue")
            .setDescription("*Use the buttons below or type a song to start!*")
            .setColor("#5cb7f7");
    }

    // Try to edit if message already exists
    let settings = (await MelodyBoard.findOne({ guildId: guild.id })) || {};
    
    let mbMsg = null;
    if (settings.panelMessageId) {
        try {
            const cached = await textChannel.messages.fetch(
                settings.panelMessageId
            );
            mbMsg = await cached.edit({
                embeds: [nowPlayingEmbed(), queueEmbed()],
                components: [
                    getRow1(guild.id),
                    getRow2(guild.id),
                    getRow3(guild.id)
                ]
            });
        } catch (e) {
            mbMsg = null; // not found, send new below
        }
    }
    if (!mbMsg) {
        mbMsg = await textChannel.send({
            embeds: [nowPlayingEmbed(), queueEmbed()],
            components: [
                getRow1(guild.id),
                getRow2(guild.id),
                getRow3(guild.id)
            ]
        });
    }
    // Store message ID (and channel) in DB for later updates
    await MelodyBoard.findOneAndUpdate(
        { guildId: guild.id },
        { channelId: textChannel.id, panelMessageId: mbMsg.id }, // add panelMessageId to schema
        { upsert: true, new: true }
    );
    return mbMsg;
}

module.exports = sendMelodyBoardPanel;
