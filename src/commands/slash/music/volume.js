const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set the playback volume')
        .addIntegerOption(option => option
            .setName('level')
            .setDescription('Volume level (0-100)')
            .setRequired(true)),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const level = interaction.options.getInteger('level');
        if (level < 0 || level > 100) {
            return interaction.reply({ content: 'Volume level must be between 0 and 100.', ephemeral: true });
        }

        const player = client.lavalink.players.get(interaction.guild.id);
        if (player) {
            player.setVolume(level);
            return interaction.reply({ content: `Volume set to ${level}.`, ephemeral: true });
        }
        return interaction.reply({ content: 'No track is currently playing.', ephemeral: true });
    }
};
