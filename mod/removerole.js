const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Remove a role from a member')
        .addUserOption(option => option.setName('target').setDescription('The member to remove the role from').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('The role to remove').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');

        if (!target.roles.cache.has(role.id)) {
            return interaction.reply({ content: 'This user does not have the role.', ephemeral: true });
        }

        await target.roles.remove(role);
        return interaction.reply({ content: `Successfully removed ${role.name} from ${target.user.tag}` });
    }
};
