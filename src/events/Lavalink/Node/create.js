module.exports = {
  event: "create",
  run: (client, node) => {
    console.log(`[Lavalink] Node created: ${node.options.identifier || node.options.host}`);
  }
};
