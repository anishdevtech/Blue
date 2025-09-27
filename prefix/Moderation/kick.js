const { Message, PermissionFlagBits, EmbedBuilder } = require('discord.js');

module.exports = {
    structure: {
        name: 'kick',
        description: 'Kicks a member from the server.',
        aliases: [''],
        permissions: "KickMembers"
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message} message 
     * @param {[String]} args 
     */
    run: async (client, message, args) => {
        try {
            // Check for required arguments
            if (!args[0]) {
                return message.reply({ content: 'Please specify a member to kick. /n ex: ?kick {member} [reason]' });
            }

            // Get the member to kick
            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            if (!member) {
                return message.reply({ content: 'Could not find that member.' });
            }

            // Ensure user has permissions to kick the member
            if (!message.member.permissions.has(PermissionFlagBits.KickMembers)) {
                return message.reply({ content: 'You do not have permission to kick members.' });
            }

            // Get the reason for the kick (optional)
            const reason = args.slice(1).join(' ') || 'No reason provided.';

            // Kick the member
            
            await member.kick(reason);

            // Send a confirmation embed
            const embed = new EmbedBuilder()
                .setColor('RED')
                .setTitle('Member Kicked')
                .setDescription(`**${member.user.tag}** has been kicked from the server.`)
                .addFields('Reason', reason, false);
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error); // Log any errors
            message.reply({ content: 'An error occurred while kicking the member.' });
        }
    }
};
