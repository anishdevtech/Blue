const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages')
        .addStringOption(option =>
            option
                .setName('amount')
                .setRequired(true)
                .setDescription('Number of messages you want to delete.'))
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user whose messages you want to delete')),

    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const targetUser = interaction.options.getUser('target');
        const amount = interaction.options.getString('amount');

        if (targetUser) {
            if (interaction.member.permissions.has('MANAGE_MESSAGES') || interaction.user.id === targetUser.id) {
                const userMessages = await interaction.channel.messages.fetch({ limit: amount })
                    .then(messages => messages.filter(msg => msg.author.id === targetUser.id));

                await interaction.channel.bulkDelete(userMessages);
                await interaction.editReply(`Successfully deleted ${amount} messages from ${targetUser.tag}.`);
            } else {
                const embed = new EmbedBuilder().setDescription("You don't have Manage Messages permission.");
                interaction.channel.send(embed);
            }
        } else {
            await interaction.channel.bulkDelete(amount);
            await interaction.reply(`Successfully deleted ${amount} message(s) on the command of <@${interaction.user.id}>`);
        }
    }
};
