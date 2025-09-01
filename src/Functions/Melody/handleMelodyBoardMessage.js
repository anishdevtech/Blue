// handleMelodyBoardMessage.js

const MelodyBoard = require("../../schemas/MelodyBoard"); // adjust path
// Import your live panel updater (shown in earlier replies)
const updateMelodyBoardPanel = require("./updateMelodyBoardPanel"); // change as needed

/**
 * Called on every messageCreate.
 * Returns true if handled as a MelodyBoard request.
 */
async function handleMelodyBoardMessage(message, client) {
    if (message.author.bot || !message.guild) return false;

    // 1. Find MelodyBoard config for this guild
    const mb = await MelodyBoard.findOne({ guildId: message.guild.id });
    if (!mb || message.channel.id !== mb.channelId) return false;

    // 2. If not in VC, prompt and delete
    const memberVC = message.member.voice?.channel;
    if (!memberVC) {
        await message
            .reply({
                content:
                    "❌ Join a voice channel to request music in MelodyBoard!",
                allowedMentions: { repliedUser: true }
            })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        await message.delete().catch(() => {});
        return true;
    }

    // 3. If in VC, process message as play request
    const query = message.content.trim();
    if (!query) {
        await message.delete().catch(() => {});
        return true;
    }

    await message.delete().catch(() => {});

    try {
        // Get or create player
        let player = client.lavalink.players.get(message.guild.id);
        if (!player) {
            player = await client.lavalink.createPlayer({
                guildId: message.guild.id,
                voiceChannelId: memberVC.id,
                textChannelId: message.channel.id,
                selfDeaf: true
            });
            await player.connect();
        } else if (player.voiceChannelId !== memberVC.id) {
            await player.moveTo(memberVC.id);
        }

        // Search/play like regular command:
        console.log(query)
        const results = await player.search(query, message.author);
        
        const tracks = Array.isArray(results.tracks) ? results.tracks : [];
        if (!tracks.length) {
            await message.channel
                .send("❌ No results found!")
                .then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
            return true;
        }

        const track = tracks[0];
        track.requestedBy = message.author;
        const alreadyPlaying = player.playing || player.paused;
        player.queue.add(track);
        if (!alreadyPlaying) await player.play();

        // Update panel (Now Playing/Queue)
        await updateMelodyBoardPanel(message.guild.id, client);
    } catch (e) {
        await message.channel
            .send("❌ Error playing your request.")
            .then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
    }

    return true;
}

module.exports = handleMelodyBoardMessage;
