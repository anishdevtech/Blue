const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Purge messages')
        .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to purge').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const amount = interaction.options.getInteger('amount');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });
        }

        const messages = await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ content: `Successfully deleted ${messages.size} messages.`, ephemeral: true });
    }
};
