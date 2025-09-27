// events/Lavalink/queueChangesWatcher.js
module.exports = {
    event: "queueChangesWatcher",
    run(client, eventData) {
        const {
            type,
            guildId,
            tracks,
            position,
            oldStoredQueue,
            newStoredQueue
        } = eventData;

        switch (type) {
            case "shuffled":
                console.log(
                    `[QueueChangesWatcher] Queue shuffled in guild ${guildId}`
                );
                break;
            case "tracksAdd":
                console.log(
                    `[QueueChangesWatcher] ${tracks.length} tracks added at position ${position} in guild ${guildId}`
                );
                break;
            case "tracksRemoved":
                console.log(
                    `[QueueChangesWatcher] ${tracks.length} tracks removed at position ${position} in guild ${guildId}`
                );
                break;
            default:
                console.log(
                    `[QueueChangesWatcher] Unknown queue change type: ${type} in guild ${guildId}`
                );
        }
    }
};
