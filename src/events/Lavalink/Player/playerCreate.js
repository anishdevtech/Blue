module.exports = {
    event: "playerCreate",
    run: async (client, player) => {
        // Patch .add
        const originalAdd = player.queue.add.bind(player.queue);
        player.queue.add = function (...args) {
            const oldStoredQueue = [...this.tracks];
            const result = originalAdd(...args);
            const newStoredQueue = [...this.tracks];
            client.lavalink.emit("queueChangesWatcher", {
                type: "tracksAdd",
                guildId: player.guildId,
                tracks: args,
                position: this.tracks.length - 1,
                oldStoredQueue,
                newStoredQueue
            });
            return result;
        };

        // Patch .remove if it exists
        if (typeof player.queue.remove === "function") {
            const originalRemove = player.queue.remove.bind(player.queue);
            player.queue.remove = function (position) {
                const oldStoredQueue = [...this.tracks];
                const removed = this.tracks[position];
                const result = originalRemove(position);
                const newStoredQueue = [...this.tracks];
                client.lavalink.emit("queueChangesWatcher", {
                    type: "tracksRemoved",
                    guildId: player.guildId,
                    tracks: [removed],
                    position,
                    oldStoredQueue,
                    newStoredQueue
                });
                return result;
            };
        }

        // Patch .shuffle if it exists
        if (typeof player.queue.shuffle === "function") {
            const originalShuffle = player.queue.shuffle.bind(player.queue);
            player.queue.shuffle = function () {
                const oldStoredQueue = [...this.tracks];
                const result = originalShuffle();
                const newStoredQueue = [...this.tracks];
                client.lavalink.emit("queueChangesWatcher", {
                    type: "shuffled",
                    guildId: player.guildId,
                    tracks: [...newStoredQueue],
                    position: null,
                    oldStoredQueue,
                    newStoredQueue
                });
                return result;
            };
        }
    }
};
