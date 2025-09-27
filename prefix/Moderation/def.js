const { Message, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    structure: {
        name: 'deaf',
        description: 'Deafens a member, preventing them from hearing voice chat.',
        aliases: [],
        permissions: "ManageMembers"
    },
    /**
     * @param {import('../class/ExtendedClient')} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
      
        // Get the mentioned member from the message
        const member = message.mentions.members.first();
        if (!member) return message.channel.send('You need to mention a member to deafen.');

        // Check if the mentioned member is in a voice channel
        if (!member.voice.channel) {
            return message.channel.send('The mentioned member is not in a voice channel.');
        }

        // Check if the bot has permission to deafen members
        if (!member.voice.channel.permissionsFor(message.guild.me).has(PermissionsBitField.Flags.DEAFEN_MEMBERS)) {
            return message.channel.send('I do not have permission to deafen members in this channel.');
        }

        // Deafen the member
        try {
            await member.voice.setDeaf(true);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Member Deafened')
                .setDescription(`${member.user.tag} has been deafened.`);
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error deafening member:', error);
            message.channel.send('An error occurred while deafening the member.');
        }
    }
};
