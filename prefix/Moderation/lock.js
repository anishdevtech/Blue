const { Message, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    structure: {
        name: 'lock',
        description: 'Locks a text channel, prevent Guild Members from sending messages.',
        aliases: [],
        permissions: "MANAGE_CHANNELS"
    },
    /**
     * @param {import('../class/ExtendedClient')} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        // Check if the user has permissions to execute the command
        // Get the mentioned channel from the message
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0])|| message.channel
       
        if (!channel || channel.type !== 0) {
            return message.channel.send('Please mention a valid text channel.');
        }

            try {
                await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                    SendMessages: false
                });
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Channel Locked')
                    .setFooter(client.config.f)
                    .setDescription(`The channel ${channel} has been locked.`);
                message.channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Error locking channel:', error);
                message.channel.send('An error occurred while locking the channel.');
            }
      
    }
};
