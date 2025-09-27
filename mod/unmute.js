const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a member')
        .addUserOption(option => option.setName('target').setDescription('The member to unmute').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getMember('target');

        if (!target.communicationDisabledUntilTimestamp) {
            return interaction.reply({ content: 'This user is not muted.', ephemeral: true });
        }

        await target.timeout(null); // Remove timeout
        return interaction.reply({ content: `Successfully unmuted ${target.user.tag}` });
    }
};
