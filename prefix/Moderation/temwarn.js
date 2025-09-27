const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const Warning = require('../../../schemas/warningSchemas.js');

module.exports = {
    structure: {
        name: 'tempwarn',
        description: 'Warns a member for a specific duration.',
        aliases: [],
        permissions: "ManageMessages"
    },
    /**
     * @param {import('../class/ExtendedClient')} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        // Check if the user has permissions to execute the command
        if (!message.member.permissions.has(PermissionsBitField.Flags.MANAGE_MESSAGES)) {
            return message.channel.send('You do not have permission to use this command.');
        }

        const user = message.mentions.users.first();
        if (!user) return message.channel.send('You need to mention a user to warn.');

        const duration = parseInt(args[1]); // Assuming duration is in minutes
        if (isNaN(duration) || duration <= 0) return message.channel.send('Please provide a valid duration.');

        const reason = args.slice(2).join(' ');
        if (!reason) return message.channel.send('Please provide a reason for the warning.');

        const expiresAt = new Date(Date.now() + duration * 60000); // Convert minutes to milliseconds

        let existingWarning = await Warning.findOne({ guild: message.guild.id, userId: user.id });
        if (existingWarning) {
            // If the user already has a schema in this guild, update it
            existingWarning.warnings.push({
                moderatorId: message.author.id,
                reason: reason,
                expiresAt: expiresAt
            });
            try {
                await existingWarning.save();
            } catch (err) {
                console.error('Error updating warning:', err);
                return message.channel.send('An error occurred while updating the warning.');
            }
        } else {
            // Create a new warning schema in the database
            const warning = new Warning({
                guild: message.guild.id,
                userId: user.id,
                warnings: [{
                    moderatorId: message.author.id,
                    reason: reason,
                    expiresAt: expiresAt
                }]
            });
            try {
                await warning.save();
            } catch (err) {
                console.error('Error saving warning:', err);
                return message.channel.send('An error occurred while saving the warning.');
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('User Warned')
            .setDescription(`${user.tag} has been warned for ${duration} minutes.`)
            .addFields(
              [
              {name:'Reason',value:reason},
              {name:'Expires At',value: `${expiresAt}`}
              ])

        message.channel.send({ embeds: [embed] });
    }
};
