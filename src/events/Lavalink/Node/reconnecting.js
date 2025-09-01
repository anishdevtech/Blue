module.exports = {
  event: "reconnecting",
  run: (client, node) => {
    console.log(`[Lavalink] Node reconnecting: ${node.options.identifier || node.options.host}`);
  }
};
