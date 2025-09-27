const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, InteractionType } = require('discord.js');
const { PermissionFlagBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
  structure: {
    name: 'ban',
    description: 'Removes a user from the server (Administrator privilege required).',
    aliases: [],
    permissions: "Administrator",
  },
  /**
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {*} args
   */
  run: async (client, message, args) => {
    // Check user permission
    if (!message.member.permissionsIn(message.channel).has(PermissionFlagBits.Administrator)) {
      return message.reply({ content: "You lack the Administrator privilege to use this command.", ephemeral: true });
    }

    // Fetch target member from mention
    const targetMember = message.mentions.members.first();

    // Validate target member presence
    if (!targetMember) {
      return message.reply({ content: 'Please mention a user to ban.', ephemeral: true });
    }

    // Check bot's ability to ban (considering member roles)
    if (!targetMember.bannable) {
      return message.reply({ content: 'The target user cannot be banned. They might have a higher role.', ephemeral: true });
    }

    // Prevent bot banning itself or other bots
    if (targetMember.isBot) {
      return message.reply({ content: 'Banning bots is not permitted.', ephemeral: true });
    }

    // Prevent banning users with higher or equal roles
    if (message.member.roles.highest.position <= targetMember.roles.highest.position) {
      return message.reply({ content: "You cannot ban someone with a higher or equal role.", ephemeral: true });
    }

    // Reason selection menu and button interaction components
const reasonOptions = [
  { label: 'Spam', value: 'spam', description: 'Spamming behavior detected.' },
  { label: 'Harassment', value: 'harassment', description: 'Instances of harassment reported.' },
  { label: 'Other (please specify)', value: 'other', description: 'Other reasons not listed.' },
];

const reasonMenu = new StringSelectMenuBuilder()
  .setCustomId('ban_reason')
  .setPlaceholder('Select a reason (optional)')
  .addOptions(
    reasonOptions.map(option => new StringSelectMenuOptionBuilder()
      .setLabel(option.label)
      .setDescription(option.description)
      .setValue(option.value)
    )
  );
    const reasonRow = new ActionRowBuilder().addComponents(reasonMenu);

    const confirmButton = new ButtonBuilder()
      .setLabel('Confirm Ban')
      .setStyle('danger')
      .setCustomId('ban_confirm');

    const cancelButton = new ButtonBuilder()
      .setLabel('Cancel')
      .setStyle('secondary')
      .setCustomId('ban_cancel');

    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    // Send confirmation prompt with reason selection and button interaction
    await message.reply({
      content: `Are you certain you want to ban ${targetMember.user.tag}?`,
      components: [reasonRow, buttonRow],
      ephemeral: true,
    });

    const collector = message.channel.createMessageComponentCollector({
      componentType: 'BUTTON',
      time: 10000,
    });

    collector.on('collect', async (collectedButtonInteraction) => {
      if (collectedButtonInteraction.customId === 'ban_cancel') {
        await collectedButtonInteraction.update({ content: 'Ban cancelled.', components: [] });
        return collector.stop();
      }

      if (collectedButtonInteraction.customId === 'ban_confirm') {
        let reason;
        if (interaction.components[0].components[0].value !== 'other') {
          reason = interaction.components[0].components[0].value;
        } else {
          const reasonMsg = await message.channel.awaitMessages({
            filter: (msg) => msg.author.id === message.author.id,
            max: 1,
            time: 10000,
          });
          if (reasonMsg.first()) {
            reason = reasonMsg.first().content;
          } else {
            await collectedButtonInteraction.update({ content: 'Please provide a reason for the ban.', components: [] });
            return collector.stop();
          }
        }

        // Execute ban with optional reason
        await targetMember.ban({ reason });
        await collectedButtonInteraction.update
}
});
}};