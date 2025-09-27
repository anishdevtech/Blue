const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move the bot to another voice channel')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('The voice channel to move to')
            .setRequired(true)),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const channel = interaction.options.getChannel('channel');
        if (channel.type !== 'GUILD_VOICE') {
            return interaction.reply({ content: 'Please select a valid voice channel.', ephemeral: true });
        }

        const player = client.lavalink.players.get(interaction.guild.id);
        if (player) {
            await player.move(channel.id);
            return interaction.reply({ content: `Moved to ${channel.name}`, ephemeral: true });
        }

        return interaction.reply({ content: 'I am not connected to a voice channel.', ephemeral: true });
    }
};
