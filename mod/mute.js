const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member')
        .addUserOption(option => option.setName('target').setDescription('The member to mute').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for muting').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target.moderatable) {
            return interaction.reply({ content: 'I cannot mute this user.', ephemeral: true });
        }

        await target.timeout(24 * 60 * 60 * 1000, reason); // Mute for 24 hours
        return interaction.reply({ content: `Successfully muted ${target.user.tag}` });
    }
};
