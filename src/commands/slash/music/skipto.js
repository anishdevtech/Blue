const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Skip to a specific track in the queue')
        .addIntegerOption(option =>
            option.setName('track')
                .setDescription('Track number to skip to')
                .setRequired(true)),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const trackNumber = interaction.options.getInteger('track');
        const player = client.lavalink.players.get(interaction.guild.id);

        if (player && trackNumber > 0 && trackNumber <= player.queue.length) {
            player.queue.splice(0, trackNumber - 1);
            player.stop();
            return interaction.reply({ content: `Skipped to track ${trackNumber}.`, ephemeral: true });
        }
        return interaction.reply({ content: 'Invalid track number.', ephemeral: true });
    }
};
