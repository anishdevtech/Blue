const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle loop for the current track or queue')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Loop mode (track/queue/off)')
                .setRequired(true)
                .addChoices(
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' },
                    { name: 'Off', value: 'off' }
                )),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const mode = interaction.options.getString('mode');
        const player = client.lavalink.players.get(interaction.guild.id);
        if (player) {
            switch (mode) {
                case 'track':
                    player.setRepeatMode(1);
                    return interaction.reply({ content: 'Looping current track.', ephemeral: true });
                case 'queue':
                    player.setRepeatMode(2);
                    return interaction.reply({ content: 'Looping current queue.', ephemeral: true });
                case 'off':
                    player.setRepeatMode(0);
                    return interaction.reply({ content: 'Looping turned off.', ephemeral: true });
                default:
                    return interaction.reply({ content: 'Invalid loop mode.', ephemeral: true });
            }
        }
        return interaction.reply({ content: 'No track is currently playing.', ephemeral: true });
    }
};
