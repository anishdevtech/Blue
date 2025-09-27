const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Warning = require('../../../schemas/Warning.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Clear all warnings from a member')
        .addUserOption(option => option.setName('target').setDescription('The member to clear warnings from').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getUser('target');

        await Warning.deleteOne({ userId: target.id, guildId: interaction.guild.id });

        return interaction.reply({ content: `Successfully cleared all warnings from ${target.tag}` });
    }
};
