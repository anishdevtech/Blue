const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current track'),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const player = client.lavalink.players.get(interaction.guild.id);
        if (player && player.playing) {
            player.pause(true);
            return interaction.reply({ content: 'Playback paused.', ephemeral: true });
        }
        return interaction.reply({ content: 'No track is currently playing.', ephemeral: true });
    }
};
