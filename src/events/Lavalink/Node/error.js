module.exports = {
  event: "error",
  run: (client, node, error, payload) => {
    console.error(`[Lavalink] Node error: ${node.options?.identifier || node.options?.host}`, error, payload);
  }
};
