module.exports = {
  event: "resumed",
  run: (client, node, payload, players) => {
    console.log(`[Lavalink] Node resumed: ${node.options.identifier || node.options.host} Fetched players: ${players?.length || 0}`);
  }
};
