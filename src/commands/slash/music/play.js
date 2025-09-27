const { SlashCommandBuilder } = require("discord.js");
const URL_REGEX = new RegExp('^(?:https?:\/\/|[a-z][a-z0-9+.-]*:)', 'i'); // Lavalink v4 search result normalization
function normalizeTracksFromResult(result) {
    if (!result) return [];
    if (Array.isArray(result.tracks)) return result.tracks;
    if (result.loadType === "search" && Array.isArray(result.data)) return result.data;
    if (result.loadType === "playlist" && Array.isArray(result.data?.tracks)) return result.data.tracks;
    if (result.loadType === "track" && result.data) return [result.data];
    return [];
}

// Platforms that don't support text search; URLs only
const URL_ONLY_PLATFORMS = new Set(["bandcamp", "twitch"]);

// Map UI platform choice to search source for lavalink-client
// Uses friendly aliases where available, and raw LavalinkSearchPlatform prefixes for plugin sources
function mapPlatformToSource(platform) {
    if (!platform) return undefined;
    const p = String(platform).toLowerCase();

    // Built-in or youtube plugin friendly aliases
    if (p === "youtube" || p === "yt") return "youtube";      // ytsearch internally
    if (p === "youtubemusic" || p === "ytm") return "youtubemusic"; // ytmsearch internally
    if (p === "soundcloud" || p === "sc") return "soundcloud";

    // LavaSrc-backed friendly alias
    if (p === "spotify" || p === "sp") return "spotify"; // spsearch

    // Raw LavalinkSearchPlatform prefixes from plugins (LavaSrc)
    if (p === "jiosaavn" || p === "js") return "jssearch"; // JioSaavn
    if (p === "applemusic" || p === "am" || p === "apple") return "amsearch";
    if (p === "deezer" || p === "dz") return "dzsearch";
    if (p === "yandexmusic" || p === "yandex") return "ymsearch";

    // URL-only built-ins
    if (p === "bandcamp") return "bandcamp"; // URL only, no text search
    if (p === "twitch") return "twitch";     // URL only, no text search

    return undefined;
}

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("play")
        .setDescription(`<:music:1412336493678166068> Play music of your choice`)
        .addStringOption(option =>
            option
                .setName("query")
                .setDescription(`<a:search:1039349322149527553> Song name or URL`)
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName("platform")
                .setDescription(`<:utility:1412336482743619584> Select the music platform`)
                .setRequired(false)
                .addChoices(
                    { name: "YouTube", value: "youtube" },
                    { name: "YouTube Music", value: "youtubemusic" },
                    { name: "SoundCloud", value: "soundcloud" },
                    { name: "Spotify", value: "spotify" },
                    { name: "JioSaavn", value: "jiosaavn" },
                    { name: "Apple Music", value: "applemusic" },
                    { name: "Deezer", value: "deezer" },
                    { name: "Yandex Music", value: "yandexmusic" },
                    { name: "Bandcamp (links only)", value: "bandcamp" },
                    { name: "Twitch (links only)", value: "twitch" }
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
                    await interaction.respond([
                        {
                            name: `${client.emoji.voice} Join a voice channel to search`,
                            value: "voice_required"
                        }
                    ]);
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
                await interaction.respond([
                    {
                        name: `${client.emoji.wifi} Lavalink not connected`,
                        value: "lavalink_offline"
                    }
                ]);
                return;
            }

            const platformChoice = interaction.options.getString("platform") || "youtube";

            // URL-only platforms: surface a helper row instead of searching
            if (URL_ONLY_PLATFORMS.has(platformChoice) && !URL_REGEX.test(focusedValue)) {
                return void interaction.respond([
                    {
                        name: `${client.emoji.link} Paste a valid ${platformChoice} URL`,
                        value: "url_required"
                    }
                ]);
            }

            const source = URL_REGEX.test(focusedValue) ? undefined : mapPlatformToSource(platformChoice);

            const results = await player.search(
                { query: focusedValue, source },
                interaction.user
            );

            const tracks = normalizeTracksFromResult(results);
            if (!tracks.length) return void interaction.respond([]);

            await interaction.respond(
                tracks.slice(0, 5).map(t => ({
                    name: (t?.info?.title || "Unknown title").slice(0, 100),
                    value: t?.info?.uri || focusedValue
                }))
            );
        } catch (error) {
            console.error("Lavalink autocomplete error:", error);
            try {
                await interaction.respond([]);
            } catch {}
        }
    },

    run: async (client, interaction) => {
        await interaction.deferReply();

        const query = interaction.options.getString("query");
        const platform = interaction.options.getString("platform") || null;
        const memberVC = interaction.member.voice?.channel;
        if (!memberVC)
            return interaction.editReply(`${client.emoji.x_new2_a} Join a voice channel first.`);

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

            // For URL-only platforms without a URL, stop early
            if (platform && URL_ONLY_PLATFORMS.has(platform) && !URL_REGEX.test(query)) {
                return interaction.editReply(`${client.emoji.link} Please provide a valid ${platform} URL.`);
            }

            const source = URL_REGEX.test(query) ? undefined : mapPlatformToSource(platform);

            const results = await player.search(
                { query, source }, // pass platform as source; omit for URLs
                interaction.user
            );

            const tracks = normalizeTracksFromResult(results);
            if (!tracks.length)
                return interaction.editReply(`${client.emoji.ignore} No results found.`);

            const track = tracks[0];
            track.requestedBy = interaction.user;

            const alreadyPlaying = player.playing || player.paused;
            await player.queue.add(track);

            if (!alreadyPlaying) {
                await player.play();
                return interaction.editReply(`${client.emoji.music} Playing your track...`);
            }

            return interaction.editReply(`${client.emoji.addsong} Added to queue.`);
        } catch (error) {
            console.error("Command run error:", error);
            interaction.editReply(`${client.emoji.x_new2_b} Unexpected error. Please try again later.`);
        }
    }
};