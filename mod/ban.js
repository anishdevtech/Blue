const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member')
        .addUserOption(option => option.setName('target').setDescription('The member to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for banning').setRequired(false))
        .addIntegerOption(option => option.setName('days').setDescription('Number of days to delete messages').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;

        if (!target.bannable) {
            return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });
        }

        await target.ban({ reason, days });
        return interaction.reply({ content: `Successfully banned ${target.user.tag}` });
    }
};
