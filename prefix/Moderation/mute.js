const { Message, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    structure: {
        name: 'mute',
        description: 'Mutes a member',
        aliases: [],
        permissions: "ManageRoles"
    },
    /**
     * @param {import('../class/ExtendedClient')} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        // Check if the user has permissions to execute the command


        // Get the mentioned member from the message
        const member = message.mentions.members.first()|| await message.guild.members.cache.get(args[0])
        if (!member) return message.channel.send('You need to mention a member to mute.');

        // Check if the member has the required permissions
        if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send('You cannot mute an administrator.');
        }

        // Check if the member is already muted
        if (member.serverMute) {
            return message.channel.send('This member is already muted.');
        }

        // Mute the member by adding the mute role
        try {
            await member.voice.setMute(true)
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Member Muted')
                .setDescription(`${member.user.tag} has been muted.`);
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error muting member:', error);
            message.channel.send('An error occurred while muting the member.');
        }
    }
};
