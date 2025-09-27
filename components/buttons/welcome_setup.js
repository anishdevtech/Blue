const { ButtonInteraction, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');
const db = require("../../schemas/welcome.js");

module.exports = {
  customId: 'welcome_setup',
  /**
   * 
   * @param {ExtendedClient} client 
   * @param {ButtonInteraction} interaction 
   */
  async run(client, interaction) {
    interaction.message.delete();
    const embed = new EmbedBuilder()
      .setTitle('Welcome Setup')
      .setDescription('Choose an option to set up for the welcome message.')
      .addFields(
        { name: '1. Message Setup', value: 'Set up a custom welcome message.' },
        { name: '2. Image Setup', value: 'Configure an image for the welcome message.' },
      /*  { name: '3. DM Setup', value: 'Set up a welcome message to be sent via DM.' },*/
        { name: '4. Full Setup', value: 'Set up all options for the welcome message.' }
      )
      .setColor(client.config.c)
      .setFooter(client.config.f);

    const message = await interaction.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('welcome_setup_message')
              .setLabel('Message Setup')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('welcome_setup_image')
              .setLabel('Image Setup')
              .setStyle(ButtonStyle.Primary),
         /*   new ButtonBuilder()
              .setCustomId('welcome_setup_dm')
              .setLabel('DM Setup')
              .setStyle(ButtonStyle.Primary),*/
            new ButtonBuilder()
              .setCustomId('welcome_setup_full')
              .setLabel('Full Setup')
              .setStyle(ButtonStyle.Primary)
          )
      ],
      
    });
  },
};
