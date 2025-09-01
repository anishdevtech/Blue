module.exports = {
  event: "disconnect",
  run: (client, node, reason) => {
    console.log(`[Lavalink] Node disconnected: ${node.options.identifier || node.options.host}, Reason: ${reason}`);
  }
};
