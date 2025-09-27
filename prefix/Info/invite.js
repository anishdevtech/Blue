const { EmbedBuilder,PermissionFlagBits, ButtonStyle, ButtonBuilder ,ActionRowBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
  structure: {
    name: 'invite',
    description: 'Get bot invite and join support server.',
    aliases: [],
    permissions: null,
  },
  /**
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {*} args
   */
  run: async (client, message) => {
    const inviteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        
        .setLabel('Invite Bot (Admin)')
        .setURL("https://discord.com/oauth2/authorize?client_id=1005531259369431041&permissions=8&scope=bot")
        .setStyle(ButtonStyle.Link)
    );

    const supportRow = inviteRow.addComponents(
      new ButtonBuilder()
        
        .setLabel('Join Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.com/invite/milanio-coding-community-tm-825260113509351454") // Replace with your support server link
    );

    const embed = new EmbedBuilder()
      .setTitle('Invite & Support')
      .setDescription(
        'Click the buttons below to invite the bot (requires admin permission) or join our support server.'
      )
      .setColor('Random')
      .setFooter({ text: 'By using the bot, you agree to the terms of service.' });

    message.reply({ embeds: [embed], components: [inviteRow] });
  },
};
