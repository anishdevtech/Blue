const updateMelodyBoardPanel = require('./updateMelodyBoardPanel');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

// Main handler: module.exports = async (interaction, client) => { ... }
module.exports = async (interaction, client) => {
    if (!interaction.isButton()) return false;

    const customId = interaction.customId;
    const guildId = customId.split("_").at(-1);

    const player = client.lavalink.players.get(guildId);
    if (!player) {
        await interaction.reply({ content: "❌ No active player for this server!", ephemeral: true });
        return true;
    }

    if (!interaction.member.voice?.channel ||
        interaction.member.voice.channel.id !== player.voiceChannelId
    ) {
        await interaction.reply({ content: "❌ You must be in the music voice channel!", ephemeral: true });
        return true;
    }

    try {
        // Play/Pause
        if (customId.startsWith("mb_playpause_")) {
            if (player.paused) player.resume();
            else player.pause();
            await interaction.reply({ content: "⏯️ Play/Pause toggled.", ephemeral: true });
        }
        // Skip
        else if (customId.startsWith("mb_skip_")) {
          if(!player.queue.length)
          return player.destroy();
            player.skip(); // Skips current track
            await interaction.reply({ content: "⏭️ Track skipped!", ephemeral: true });
        }
        // Previous
        else if (customId.startsWith("mb_prev_")) {
            if (player.queue.previous && player.queue.previous.length) {
                const prevTrack = player.queue.previous.pop();
                player.queue.tracks.unshift(player.queue.current);
                player.queue.current = prevTrack;
                player.play(prevTrack);
                await interaction.reply({ content: "⏮️ Playing previous track!", ephemeral: true });
            } else {
                await interaction.reply({ content: "No previous track available.", ephemeral: true });
            }
        }
        // Stop
        else if (customId.startsWith("mb_stop_")) {
            player.destroy();
            await interaction.reply({ content: "⏹️ Playback stopped and player destroyed.", ephemeral: true });
        }
        // Shuffle
        else if (customId.startsWith("mb_shuffle_")) {
            player.queue.shuffle();
            await interaction.reply({ content: "🔀 Queue shuffled!", ephemeral: true });
        }
        // Volume Down
        else if (customId.startsWith("mb_vol_down_")) {
            player.volume = Math.max(player.volume - 10, 0);
            await interaction.reply({ content: `🔉 Volume set to ${player.volume}`, ephemeral: true });
        }
        // Volume Up
        else if (customId.startsWith("mb_vol_up_")) {
            player.volume = Math.min(player.volume + 10, 150);
            await interaction.reply({ content: `🔊 Volume set to ${player.volume}`, ephemeral: true });
        }
        // Mute
        else if (customId.startsWith("mb_mute_")) {
            player.volume = 0;
            await interaction.reply({ content: "🔇 Muted.", ephemeral: true });
        }
        // Repeat (toggle between none, track, queue)
        else if (customId.startsWith("mb_repeat_")) {
            // For demo: toggle repeatMode property on player (add your logic if custom)
            player.repeatMode = player.repeatMode === "none"
                ? "track"
                : player.repeatMode === "track"
                    ? "queue"
                    : "none";
            await interaction.reply({ content: `🔁 Repeat mode: ${player.repeatMode}`, ephemeral: true });
        }
        // Refresh Panel
        else if (customId.startsWith("mb_queue_refresh_")) {
            await interaction.reply({ content: "🔄 Panel refreshed.", ephemeral: true });
        }
        // Add Song Modal
        else if (customId.startsWith("mb_add_song_")) {
            const modal = new ModalBuilder()
                .setCustomId(`mb_modal_addsong_${guildId}`)
                .setTitle("Add Song to MelodyBoard")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("song_query")
                            .setLabel("Song name or URL")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);
            return true;
        }
        // Add Playlist Modal
        else if (customId.startsWith("mb_add_playlist_")) {
            const modal = new ModalBuilder()
                .setCustomId(`mb_modal_addplaylist_${guildId}`)
                .setTitle("Add Playlist to MelodyBoard")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("playlist_url")
                            .setLabel("Playlist URL")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);
            return true;
        }

        // Always refresh panel after user action
        await updateMelodyBoardPanel(guildId, client);
        return true;
    } catch (e) {
        await interaction.reply({ content: "❌ Error handling button.", ephemeral: true });
        console.error(e);
        return true;
    }
};
