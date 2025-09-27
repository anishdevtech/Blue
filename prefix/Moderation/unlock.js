const { Message, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    structure: {
        name: 'unlock',
        description: 'Unlocks a text channel, allowing members to send messages.',
        aliases: [],
        permissions: "ManageChannels"
    },
    /**
     * @param {import('../class/ExtendedClient')} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        
        // Get the mentioned channel from the message
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0])||message.channel
        if (!channel || channel.type !== 0) {
            return message.channel.send('Please mention a valid text channel.');
        }

            try {
                await channel.permissionOverwrites.edit(message.guild.id, {
                    SendMessages: true
                });
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('Channel Unlocked')
                    .setDescription(`The channel ${channel} has been unlocked.`)
                    .setFooter(client.config.f);
                message.channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Error unlocking channel:', error);
                message.channel.send('An error occurred while unlocking the channel.');
            }
        
    }
};
