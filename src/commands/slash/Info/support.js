const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Link to bot discord server'),

    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const supportServerLink = 'https://discord.gg/your-support-server-invite';

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Support Server')
            .setDescription(`Join our [Support Server](${supportServerLink}) for help and information.`)
            .setTimestamp()
            .setFooter({ text: 'Support Team' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
