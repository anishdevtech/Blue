module.exports = {
  event: "raw",
  run: (client, node, payload) => {
    // This is raw protocol data from Lavalink
    // Usually left empty, but you can debug as needed
    // console.log(`[Lavalink] Node raw event: ${node.options.identifier || node.options.host}`, payload);
  }
};
