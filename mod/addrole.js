const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Add a role to a member')
        .addUserOption(option => option.setName('target').setDescription('The member to add the role to').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('The role to add').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');

        if (target.roles.cache.has(role.id)) {
            return interaction.reply({ content: 'This user already has the role.', ephemeral: true });
        }

        await target.roles.add(role);
        return interaction.reply({ content: `Successfully added ${role.name} to ${target.user.tag}` });
    }
};
