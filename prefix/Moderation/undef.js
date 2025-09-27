const { Message, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    structure: {
        name: 'undeaf',
        description: 'Undeafens a member, allowing them to hear voice chat again.',
        aliases: [],
        permissions: "ManageMember"
    },
    /**
     * @param {import('../class/ExtendedClient')} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
       
        // Get the mentioned member from the message
        const member = message.mentions.members.first();
        if (!member) return message.channel.send('You need to mention a member to undeafen.');

        // Check if the mentioned member is in a voice channel
        if (!member.voice.channel) {
            return message.channel.send('The mentioned member is not in a voice channel.');
        }

        // Check if the bot has permission to undeafen members
        if (!member.voice.channel.permissionsFor(message.guild.me).has(PermissionsBitField.Flag.DEAFEN_MEMBERS)) {
            return message.channel.send('I do not have permission to undeafen members in this channel.');
        }

        // Undeafen the member
        try {
            await member.voice.setDeaf(false);
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Member Undeafened')
                .setDescription(`${member.user.tag} has been undeafened.`);
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error undeafening member:', error);
            message.channel.send('An error occurred while undeafening the member.');
        }
    }
};
