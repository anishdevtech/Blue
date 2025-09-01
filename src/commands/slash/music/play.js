const { SlashCommandBuilder } = require("discord.js");

// Lavalink v4 search result normalization
function normalizeTracksFromResult(result) {
  if (!result) return [];
  if (Array.isArray(result.tracks)) return result.tracks;
  if (result.loadType === "search" && Array.isArray(result.data)) return result.data;
  if (result.loadType === "playlist" && Array.isArray(result.data?.tracks)) return result.data.tracks;
  if (result.loadType === "track" && result.data) return [result.data];
  return [];
}

// Autocomplete: unchanged, just suggest top 5 tracks with player bootstrap
module.exports = {
  structure: new SlashCommandBuilder()
    .setName("play")
    .setDescription("🎵 Play music of your choice")
    .addStringOption(option =>
      option.setName("query").setDescription("🔍 Song name or URL").setRequired(true).setAutocomplete(true)
    )
    .addStringOption(option =>
      option.setName("platform").setDescription("🧩 Select the music platform").setRequired(false)
        .addChoices(
          { name: "YouTube", value: "youtube" },
          { name: "Spotify", value: "spotify" },
          { name: "SoundCloud", value: "soundcloud" }
        )
    ),

  autocomplete: async (client, interaction) => {
    try {
      const focusedValue = interaction.options.getFocused() || "";
      if (!focusedValue.trim()) return void interaction.respond([]);

      const guild = interaction.guild;
      if (!guild) return void interaction.respond([]);

      let player = client.lavalink.players.get(guild.id);
      if (!player) {
        const memberVC = interaction.member?.voice?.channel;
        if (!memberVC) {
          await interaction.respond([{ name: "Join a voice channel to search", value: "voice_required" }]);
          return;
        }
        player = await client.lavalink.createPlayer({
          guildId: guild.id,
          voiceChannelId: memberVC.id,
          textChannelId: interaction.channelId,
          selfDeaf: true
        });
        await player.connect();
      }

      const firstNode = client.lavalink.nodeManager?.nodes?.values()?.next()?.value;
      if (!firstNode || !firstNode.isAlive) {
        await interaction.respond([{ name: "Lavalink not connected", value: "lavalink_offline" }]);
        return;
      }

      const searchQuery = `ytsearch:${focusedValue}`;
      const results = await client.lavalink.players.get(guild.id).search(searchQuery, interaction.user, false);
      const tracks = normalizeTracksFromResult(results);
      if (!tracks.length) return void interaction.respond([]);

      await interaction.respond(
        tracks.slice(0, 5).map(t => ({
          name: (t?.info?.title || "Unknown title").slice(0, 100),
          value: t?.info?.uri || searchQuery
        }))
      );
    } catch (error) {
      console.error("Lavalink autocomplete error:", error);
      try { await interaction.respond([]); } catch {}
    }
  },

  run: async (client, interaction) => {
    await interaction.deferReply();

    const query = interaction.options.getString("query");
    const platform = interaction.options.getString("platform") || "youtube";
    const memberVC = interaction.member.voice?.channel;
    if (!memberVC) return interaction.editReply("❌ Join a voice channel first.");

    try {
      let player = client.lavalink.players.get(interaction.guild.id);
      if (!player) {
        player = await client.lavalink.createPlayer({
          guildId: interaction.guild.id,
          voiceChannelId: memberVC.id,
          textChannelId: interaction.channel.id,
          selfDeaf: true
        });
        await player.connect();
      } else if (player.voiceChannelId !== memberVC.id) {
        await player.moveTo(memberVC.id);
      }

      const results = await player.search(query, interaction.user, platform);
      const tracks = normalizeTracksFromResult(results);
      if (!tracks.length) return interaction.editReply("❌ No results found.");

      const track = tracks[0];
      track.requestedBy = interaction.user;

      const alreadyPlaying = player.playing || player.paused;
      player.queue.add(track);

      // Only play immediately if nothing is playing/paused—status sent via events
      if (!alreadyPlaying) {
        await player.play();
        return interaction.editReply("▶️ Playing your track...");
      }

      // Otherwise inform just "added to queue"
      return interaction.editReply("➕ Added to queue.");
    } catch (error) {
      console.error("Command run error:", error);
      interaction.editReply("❌ Unexpected error. Please try again later.");
    }
  }
};
