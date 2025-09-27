const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, InteractionType ,EmbedBuilder ,ButtonStyle} = require('discord.js');

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('invite') // Replace with your desired command name
    .setDescription('Get bot invite and join support server.'), // Replace with your command description

  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
 run: async(client, interaction) => {
const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        
        .setLabel('Invite Bot (Admin)')
        .setURL("https://discord.com/oauth2/authorize?client_id=1005531259369431041&permissions=8&scope=bot")
        .setStyle(ButtonStyle.Link)
    );

    const supportRow = row.addComponents(
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

    await interaction.reply({ embeds:[embed], components: [row] });
  },
};
