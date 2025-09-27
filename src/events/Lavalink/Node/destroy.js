module.exports = {
  event: "destroy",
  run: (client, node) => {
    console.log(`[Lavalink] Node destroyed: ${node.options.identifier || node.options.host}`);
  }
};
