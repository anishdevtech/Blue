const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current music queue'),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const player = client.lavalink.players.get(interaction.guild.id);
        if (player && player.queue.length > 1) {
            player.queue.shuffle();
            return interaction.reply({ content: 'Queue shuffled.', ephemeral: true });
        }
        return interaction.reply({ content: 'Not enough tracks in the queue to shuffle.', ephemeral: true });
    }
};
