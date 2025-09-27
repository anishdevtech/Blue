const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { getLyrics } = require('../../../Functions/music.js');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get the lyrics for the current or specified track')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song name or leave empty for the current track')
                .setRequired(false)),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const query = interaction.options.getString('query');
        let trackName = query;
            await interaction.deferReply();
        const player = client.lavalink.players.get(interaction.guild.id);
        if (!query && player && player.playing) {
            trackName = player.queue.current.info.title;
        }

        if (!trackName) {
            return interaction.editReply({ content: 'No track specified and no track is currently playing.', ephemeral: true });
        }

        const lyrics = await getLyrics(trackName);
        if (lyrics) {
            const embed = new EmbedBuilder()
                .setTitle(`Lyrics for ${trackName}`)
                .setDescription(lyrics.length > 4096 ? `${lyrics.substring(0, 4093)}...` : lyrics)
                .setColor('#0099ff');

            return interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        return interaction.editReply({ content: 'Lyrics not found.', ephemeral: true });
    }
};
