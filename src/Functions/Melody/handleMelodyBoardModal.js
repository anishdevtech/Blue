const updateMelodyBoardPanel = require("./updateMelodyBoardPanel");

/**
 * Handles all MelodyBoard modal submits (Add Song/Add Playlist),
 * always deferring immediately to avoid Discord's Unknown interaction error.
 */
async function handleMelodyBoardModal(interaction, client) {
    if (!interaction.isModalSubmit()) return false;

    try {
        // Defer reply immediately, always!
        await interaction.deferReply({ ephemeral: true });

        // Parse modal customId
        const modalIdParts = interaction.customId.split("_");
        const type = modalIdParts[2]; // 'addsong' or 'addplaylist'
        const guildId = modalIdParts[3];

        // Get player instance
        const player = client.lavalink.players.get(guildId);
        if (!player) {
            await interaction.editReply({
                content: "❌ No active player exists (join VC first)!"
            });
            return true;
        }

        // Handle Add Song Modal
        if (type === "addsong") {
            const query = interaction.fields.getTextInputValue("song_query");
            const result = await player.search(query, interaction.user, "ytmsearch");
            const tracks = Array.isArray(result?.tracks) ? result.tracks : [];
            if (!tracks.length) {
                await interaction.editReply({
                    content: "❌ No song found."
                });
                return true;
            }
            const song = tracks[0];
            song.requestedBy = interaction.user;
            player.queue.add(song);
            if (!player.playing && !player.paused) await player.play();
            await updateMelodyBoardPanel(guildId, client);
            await interaction.editReply({
                content: `✔️ Added [${song.info.title}](${song.info.uri}) to the queue!`
            });
            return true;
        }

        // Handle Add Playlist Modal
        if (type === "addplaylist") {
            const query = interaction.fields.getTextInputValue("playlist_url");
            const result = await player.search(query, interaction.user, "ytmsearch");
            let tracks = [];
            if (result.loadType === "playlist" && Array.isArray(result.tracks)) {
                tracks = result.tracks.slice(0, 25);
            } else {
                tracks = Array.isArray(result.tracks) ? result.tracks.slice(0, 25) : [];
            }
            if (!tracks.length) {
                await interaction.editReply({
                    content: "❌ No playlist tracks found."
                });
                return true;
            }
            tracks.forEach(track => {
                track.requestedBy = interaction.user;
                player.queue.add(track);
            });
            if (!player.playing && !player.paused) await player.play();
            await updateMelodyBoardPanel(guildId, client);
            await interaction.editReply({
                content: `✔️ Added ${tracks.length} tracks from playlist!`
            });
            return true;
        }

        // Unknown modal type
        await interaction.editReply({
            content: "❌ Unknown modal type!"
        });
        return false;
    } catch (error) {
        // If something fails, ensure error reply goes through
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferReply({ ephemeral: true });
            }
            await interaction.editReply({
                content: "❌ Error handling modal."
            });
        } catch {}
        console.error(error);
        return true;
    }
}

module.exports = handleMelodyBoardModal;
