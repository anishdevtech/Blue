const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next track in the queue'),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const player = client.lavalink.players.get(interaction.guild.id);
        if (player && player.queue.length) {
            player.stop();
            return interaction.reply({ content: 'Skipped to the next track.', ephemeral: true });
        }
        return interaction.reply({ content: 'No more tracks in the queue.', ephemeral: true });
    }
};
