const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member')
        .addUserOption(option => option.setName('target').setDescription('The member to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for kicking').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target.kickable) {
            return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });
        }

        await target.kick(reason);
        return interaction.reply({ content: `Successfully kicked ${target.user.tag}` });
    }
};
