/**
 * Converts milliseconds to a readable format like mm:ss or hh:mm:ss
 * @param {number} ms 
 * @returns {string}
 */
 function emitQueueChange(client, type, player, tracks, position, oldStoredQueue, newStoredQueue) {
    client.lavalink.emit("queueChangesWatcher", {
        type,
        guildId: player.guildId,
        tracks,
        position,
        oldStoredQueue,
        newStoredQueue
    });
}

function formatDuration(ms) {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports.formatDuration = formatDuration;function getVideoId(url) {
    const urlObj = new URL(url);
    let videoId = urlObj.searchParams.get("v");

    if (!videoId && urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
    }

    if (!videoId) {
        const match = url.match(
            /\/embed\/([a-zA-Z0-9_-]+)|\/v\/([a-zA-Z0-9_-]+)/
        );
        videoId = (match && match[1]) || null;
    }

    return videoId;
}

function getThumbnailUrl(videoUrl) {
    const videoId = getVideoId(videoUrl);
    if (!videoId) {
        console.error("Invalid YouTube URL");
        return null;
    }
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
const https = require("https");
const getColors = require("get-image-colors");

async function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, response => {
                if (response.statusCode !== 200) {
                    reject(new Error("Failed to fetch image"));
                    return;
                }

                let data = [];
                response.on("data", chunk => {
                    data.push(chunk);
                });

                response.on("end", () => {
                    const buffer = Buffer.concat(data);
                    resolve(buffer);
                });
            })
            .on("error", err => {
                reject(err);
            });
    });
}/**
 * Converts milliseconds to a readable format like mm:ss or hh:mm:ss
 * @param {number} ms 
 * @returns {string}
 */
function formatDuration(ms) {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports.formatDuration = formatDuration;
/**
 * Converts milliseconds to a readable format like mm:ss or hh:mm:ss
 * @param {number} ms 
 * @returns {string}
 */
function formatDuration(ms) {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


async function getDominantColor(imageUrl) {
    try {
        const imageBuffer = await fetchImageBuffer(imageUrl);
        const colors = await getColors(imageBuffer, "image/jpeg"); // Ensure the format is specified correctly
        const dominantColor = colors[0].hex();
        return dominantColor;
    } catch (error) {
        console.error("Error:", error);
    }
}
const axios = require("axios");

async function getLyrics(trackName) {
    const accessToken = "lWk88qIZFK-3OKf3lZvbKsLJdmlyFAz_yBSXQFYXJTAdc02nMmYtRhfQz0tRG6Ie"; // Replace with your Genius API access token
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(
        trackName
    )}`;

    try {
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const hits = searchResponse.data.response.hits;
        if (hits.length > 0) {
            const songUrl = hits[0].result.url;

            // Fetch the song page to extract lyrics
            const songPageResponse = await axios.get(songUrl);
            const html = songPageResponse.data;

            // Extract lyrics using regex or a library like cheerio
            const lyricsMatch = html.match(/<div class="lyrics">(.+?)<\/div>/s);
            if (lyricsMatch && lyricsMatch[1]) {
                const lyrics = lyricsMatch[1]
                    .replace(/<br\s*\/?>/g, "\n") // Convert HTML line breaks to newlines
                    .replace(/<.+?>/g, ""); // Remove remaining HTML tags

                return lyrics.trim();
            }
        }

        return "Lyrics not found.";
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        return "An error occurred while fetching the lyrics.";
    }
}
// MelodyBoard lookup
const MelodyBoard = require("../schemas/MelodyBoard"); // path as needed

async function getMelodyBoardChannelId(guildId) {
  const entry = await MelodyBoard.findOne({ guildId });
  return entry ? entry.channelId : null;
}

module.exports = {
  getMelodyBoardChannelId,
    getLyrics,
    getThumbnailUrl,
    getDominantColor,
    formatDuration,
    emitQueueChange
};
