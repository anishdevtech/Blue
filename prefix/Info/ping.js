const { Message, MessageEmbed } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
  structure: {
    name: 'ping',
    description: 'Replies with Pong! and detailed latency information.',
    aliases: ['p'],
    permissions: 'Administrator',
    cooldown: 500,
  },
  run: async (client, message, args) => {
    const sentTime = Date.now();

    const messageRoundtrip = await message.reply({
      content: 'Pinging...',
    });

    const websocketPing = client.ws.ping;
    const messageRoundtripTime = Date.now() - sentTime;

    const embed = new MessageEmbed()
      .setTitle(' Pong! Here\'s my latency')
      .addField('WebSocket Ping', `${websocketPing} ms`, true)
      .addField('Message Roundtrip', `${messageRoundtripTime} ms`, true);

    message.channel.send({ embeds: [embed] });
  },
};
