const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../../schemas/Warning');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('viewwarns')
        .setDescription('View warnings of a member')
        .addUserOption(option => option.setName('target').setDescription('The member to view warnings of').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const target = interaction.options.getUser('target');

        const warningRecord = await Warning.findOne({ userId: target.id, guildId: interaction.guild.id });

        if (!warningRecord || warningRecord.warnings.length === 0) {
            return interaction.reply({ content: `${target.tag} has no warnings.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${target.tag}`)
            .setColor('YELLOW')
            .setTimestamp();

        warningRecord.warnings.forEach((warning, index) => {
            embed.addFields(
                { name: `Warning ${index + 1}`, value: `**Reason:** ${warning.reason}\n**Moderator:** <@${warning.moderatorId}>\n**Date:** ${new Date(warning.timestamp).toLocaleDateString()}`, inline: false }
            );
        });

        return interaction.reply({ embeds: [embed] });
    }
};
