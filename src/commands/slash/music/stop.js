const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the current track and clear the queue'),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const player = client.lavalink.players.get(interaction.guild.id);
        if (player) {
            player.queue.clear();
            player.stop();
            return interaction.reply({ content: 'Playback stopped and queue cleared.', ephemeral: true });
        }
        return interaction.reply({ content: 'No track is currently playing.', ephemeral: true });
    }
};
