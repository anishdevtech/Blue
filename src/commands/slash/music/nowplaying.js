const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const { getThumbnailUrl, getDominantColor } = require('../../../Functions/music.js');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the currently playing track'),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const player = client.lavalink.players.get(interaction.guild.id);
        if (player && player.playing) {
            const track = player.queue.current;
            const thumbnail = await getThumbnailUrl(track.info.uri);
            const color = await getDominantColor(thumbnail);

            const embed = new EmbedBuilder()
                .setTitle('Now Playing')
                .setDescription(`[${track.info.title}](${track.info.uri})`)
                .setColor(color)
                .setThumbnail(thumbnail)
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        return interaction.reply({ content: 'No track is currently playing.', ephemeral: true });
    }
};
