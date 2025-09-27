const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the current track'),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const player = client.lavalink.players.get(interaction.guild.id);
        if (player && player.paused) {
            player.pause(false);
            return interaction.reply({ content: 'Playback resumed.', ephemeral: true });
        }
        return interaction.reply({ content: 'No track is currently paused.', ephemeral: true });
    }
};
