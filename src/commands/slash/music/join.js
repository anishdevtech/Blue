const { ChatInputCommandInteraction, SlashCommandBuilder } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join the user\'s voice channel'),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const memberVoiceChannel = interaction.member.voice.channel;
        if (!memberVoiceChannel) {
            return interaction.reply('You need to be in a voice channel to summon the bot!');
        }

        let player = client.lavalink.players.get(interaction.guild.id);
        if (!player) {
            player = await client.lavalink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: memberVoiceChannel.id,
                textChannelId: interaction.channel.id,
                selfDeaf: true
            });
            await player.connect();
        }
        
        return interaction.reply({ content: '<:autoplay:1413276754839076944>Joined the voice channel!', ephemeral: true });
    }
};
