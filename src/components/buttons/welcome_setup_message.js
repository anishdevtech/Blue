const { ButtonInteraction, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');
const db = require("../../schemas/welcome.js");
const {Welcome_Setup_Message} = require("../../Functions/Welcome.js")
module.exports = {
  customId: 'welcome_setup_message',
  max:1,
  /**
   * Handles button interaction for welcome message setup
   * @param {ExtendedClient} client
   * @param {ButtonInteraction} interaction
   */
  async run(client, interaction) {
    await client.buttonDisable(interaction);
    await Welcome_Setup_Message(client,interaction,db);
  },
};
