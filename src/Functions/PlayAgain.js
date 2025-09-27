// utils/playAgain.js
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ChannelType,
    EmbedBuilder
} = require("discord.js");

/**
 * Build a persistent "Play Again" button row.
 * customId format: play_again:<guildId>:<identifier>
 * - identifier is the source ID (e.g., YouTube video ID), not a URL.
 */
function buildPlayAgainRow(guildId, identifier) {
    if (!identifier) return new ActionRowBuilder(); // require identifier

    const btn = new ButtonBuilder()
        .setCustomId(`play_again:${guildId}:${identifier}`)
        .setLabel("▶️ Play Again")
        .setStyle(ButtonStyle.Success);

    return new ActionRowBuilder().addComponents(btn);
}

/**
 * Resolve a track by identifier directly (no URL logic).
 * Uses your existing player.search signature: player.search(query, requester, allowPlaylist?)
 */
async function resolveTrackByIdentifier(
    lavalinkManager,
    identifier,
    player,
    interaction
) {
    try {
        // Directly pass the identifier. Lavalink supports raw identifiers and prefixed searches. [web:100][web:115]
        // If your node requires a prefixed search, switch to `ytsearch:${identifier}` or similar.
        let query = `https://www.youtube.com/watch?v=${identifier}`;
        
        const res = await player.search(query, interaction.user);
    
        if (!res || !res.tracks?.length) return null;

        // Prefer exact match by info.identifier when searching by bare identifier
        const exact = res.tracks.find(t => t.info?.identifier === identifier);
        return exact || res.tracks[0];
    } catch (e) {
        console.error(e);
        return null;
    }
}

/**
 * Handle a Play Again button interaction safely.
 * Only acts when customId starts with "play_again:" and always searches by identifier.
 */
async function handlePlayAgainInteraction(
    interaction,
    client,
    lavalinkManager
) {
    if (!interaction.isButton()) return false;
    const { customId } = interaction;

    // Guard: act only on our button namespace
    if (!customId.startsWith("play_again:")) return false;

    // Parse payload: play_again:guildId:identifier
    
    const [, guildId, ...rest] = customId.split(":");
    const identifier = rest.join(":"); // in case identifier ever contains ':'
    
    if (!guildId || !identifier) {
        await interaction
            .reply({ content: "Invalid button payload.", ephemeral: true })
            .catch(() => {});
        return true;
    }

    // Ensure guild/channel context
    if (!interaction.inGuild()) {
        await interaction
            .reply({
                content: "Use this in a server channel.",
                ephemeral: true
            })
            .catch(() => {});
        return true;
    }
    const guild = interaction.guild;
    const channel = interaction.channel;
    if (!guild || !channel || channel.type !== ChannelType.GuildText) {
        await interaction
            .reply({ content: "Unsupported channel.", ephemeral: true })
            .catch(() => {});
        return true;
    }

    // Bot permissions
    const me =
        guild.members.me || (await guild.members.fetchMe().catch(() => null));
    const perms = channel.permissionsFor(me?.id);
    if (
        !perms?.has(PermissionsBitField.Flags.SendMessages) ||
        !perms?.has(PermissionsBitField.Flags.EmbedLinks)
    ) {
        await interaction
            .reply({
                content: "Missing permissions in this channel.",
                ephemeral: true
            })
            .catch(() => {});
        return true;
    }

    // Voice checks
    const member = await guild.members
        .fetch(interaction.user.id)
        .catch(() => null);
    const userVc = member?.voice?.channel;
    if (!userVc) {
        await interaction
            .reply({ content: "Join a voice channel first.", ephemeral: true })
            .catch(() => {});
        return true;
    }
    const botVc = me?.voice?.channel;
    if (botVc && botVc.id !== userVc.id) {
        await interaction
            .reply({
                content: "Join my voice channel to replay.",
                ephemeral: true
            })
            .catch(() => {});
        return true;
    }

    await interaction.deferReply({ ephemeral: true }).catch(() => {});

    // Get or create player
    let player = lavalinkManager.players.get(guild.id);
    if (!player) {
        player = await lavalinkManager.createPlayer({
            guildId: guild.id,
            voiceChannelId: userVc.id,
            textChannelId: channel.id,
            selfDeaf: true
        });
    }
    if (!player) {
        await interaction
            .editReply({ content: "Could not create a player." })
            .catch(() => {});
        return true;
    }

    // Connect to voice if needed
    if (!botVc) {
        try {
            await player.connect();
        } catch {
            await interaction
                .editReply({ content: "Failed to connect to voice." })
                .catch(() => {});
            return true;
        }
    }

    // Resolve and play strictly by identifier
    const track = await resolveTrackByIdentifier(
        lavalinkManager,
        identifier,
        player,
        interaction
    );
    if (!track) {
        await interaction
            .editReply({ content: "Could not find the track to replay." })
            .catch(() => {});
        return true;
    }

    try {
        await player.play({ clientTrack: track, requester: interaction.user });
    } catch {
        await interaction
            .editReply({ content: "Failed to start playback." })
            .catch(() => {});
        return true;
    }

    const done = new EmbedBuilder()
        .setColor("#57F287")
        .setTitle("▶️ Playing again")
        .setDescription(
            `[${track.info?.title || "Track"}](${track.info?.uri || ""})`
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` });

    await interaction
        .editReply({ embeds: [done], content: "" })
        .catch(() => {});
    return true;
}

module.exports = {
    buildPlayAgainRow,
    handlePlayAgainInteraction
};
