const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { time } = require('../../../functions');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server.'),

    run: async (client, interaction) => {
        const guild = interaction.guild;
const embed = new EmbedBuilder()
    .setTitle('Server Information')
    .setColor('Blurple')
    .addFields(
       { name: 'Name', value: guild.name },
        { name: 'ID', value: guild.id },
        { name: 'Owner', value: `<@${guild.ownerId}>` },
        { name: 'Created At', value: `${time(guild.createdTimestamp, 'd')} (${time(guild.createdTimestamp, 'R')})` },
        { name: 'Member Count', value: guild.memberCount.toString() },
   //     { name: 'Region', value: guild.region },
       { name: 'Verification Level', value: guild.verificationLevel.toString() },
        { name: 'AFK Timeout', value: `${guild.afkTimeout / 60} minutes` },
        { name: 'Default Message Notifications', value: guild.defaultMessageNotifications === 0 ? 'All messages' : 'Mentions only' },
        { name: 'Explicit Content Filter', value: guild.explicitContentFilter.toString() }, // Convert to string
        { name: 'Roles Count', value: guild.roles.cache.size.toString() },
        { name: 'Channels Count', value: guild.channels.cache.size.toString() },
        { name: 'Emojis Count', value: guild.emojis.cache.size.toString() },
        { name: 'Server Features', value: guild.features.join(', ') || 'None' }
    );

await interaction.reply({ embeds: [embed] });

    }
};
