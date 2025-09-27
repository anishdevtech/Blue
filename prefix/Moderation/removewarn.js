const { ButtonStyle } = require('discord.js');
const { StringSelectMenuBuilder,EmbedBuilder,ActionRowBuilder, ButtonBuilder } = require('discord.js');
const Warning = require("../../../schemas/warningSchemas.js");
module.exports = {
    structure: {
        name: 'listwarn',
        description: 'Clears warnings from a member\'s moderation record.',
        aliases: ["managewarn","warns"],
        permissions: "ManageMessages" // Corrected the permission string
    },
    /**
     * @param {import('../class/ExtendedClient')} client 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (client, message, args) => {
        // Get the mentioned member from the message
        const member = message.mentions.members.first()||message.guild.members.cache.get(args[0])
        if (!member) return message.channel.send('You need to mention a member to clear warnings.');

        try {
            // Find the user's warnings from the database
            const userWarnings = await Warning.findOne({ userId:member.id,guild: message.guild.id})
            console.log(userWarnings)
            if (!userWarnings || userWarnings.warnings.length === 0) {
                return message.channel.send('This user has no warnings.');
            }

            // Create options for select menu
            const options = userWarnings.warnings.map((warning, index) => ({
                label: `Warning ${index + 1}`,
                value: index.toString()
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('clear_warn_menu')
                .setPlaceholder('Select a warning to get precise Information about it')
                .addOptions(options);

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setColor(client.config.c) // Set color from client config
                .setTitle(`${member.user.tag}'s Warnings`)
                .setDescription('Select a warning to manage it ')
                .setFooter(client.config.f); // Set footer from client config

            const warningMessage = await message.channel.send({ embeds: [embed], components: [actionRow] });

            const filter = interaction => interaction.user.id === message.author.id;
            const collector = warningMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async interaction => {
                const selectedIndex = parseInt(interaction.values[0]);
                if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= userWarnings.warnings.length) {
                    await interaction.reply({ content: 'Invalid selection. Please select a valid warning.', ephemeral: true });
                    return;
                }

                // Manage or Remove Warning
                const manageWarningEmbed = new EmbedBuilder()
                    .setColor(client.config.c)
                    .setTitle(`Manage Warning ${selectedIndex + 1}`)
                    .setDescription(`Would you like to edit or remove this warning?`);

                const editButton = new ButtonBuilder()
                    .setCustomId('edit_warning')
                    .setLabel('Edit')
                    .setStyle(ButtonStyle.Primary);

                const removeButton = new ButtonBuilder()
                    .setCustomId('remove_warning')
                    .setLabel('Remove')
                    .setStyle(ButtonStyle.Danger);

                const manageActionRow = new ActionRowBuilder()
                    .addComponents(editButton, removeButton);

                await interaction.update({ embeds: [manageWarningEmbed], components: [manageActionRow] });

                const manageCollector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
                manageCollector.on('collect', async manageInteraction => {
                    if (manageInteraction.customId === 'edit_warning') {
                        // Edit Warning (Reason or Time)
                        const editReasonEmbed = new EmbedBuilder()
                            .setColor(client.config.c)
                            .setTitle(`Edit Reason for Warning ${selectedIndex + 1}`)
                            .setDescription(`Please provide a new reason for this warning.`)
                            .setFooter(client.config.f);

                        await manageInteraction.update({ embeds: [editReasonEmbed], components: [] });

                        const reasonCollector = interaction.channel.createMessageCollector({ filter, time: 60000 });
                        reasonCollector.on('collect', async collectedMessage => {
                            const newReason = collectedMessage.content;
                            // Update reason in database
                            userWarnings.warnings[selectedIndex].reason = newReason;
                            await userWarnings.save();
                            const updatedEmbed = new EmbedBuilder()
                                .setColor(client.config.c)
                                .setTitle(`${member.user.tag}'s Warnings`)
                                .setDescription('Warning reason updated successfully.')
                                .setFooter(client.config.f);
                            await manageInteraction.update({ embeds: [updatedEmbed] });
                            reasonCollector.stop();
                        });
                    } else if (manageInteraction.customId === 'remove_warning') {
                        // Remove Warning
                        userWarnings.warnings.splice(selectedIndex, 1);
                        await userWarnings.save();
                        const removedEmbed = new EmbedBuilder()
                            .setColor(client.config.c)
                            .setTitle(`${member.user.tag}'s Warnings`)
                            .setDescription(`Warning ${selectedIndex + 1} removed successfully.`)
                            .setFooter(client.config.f);
                        await manageInteraction.channel.send({ embeds: [removedEmbed] });
                    }
                    manageCollector.stop();
                });

                manageCollector.on('end', () => {
                    interaction.update({ components: [] });
                });
            });

            collector.on('end', () => {
                warningMessage.edit({ components: [] });
            });

        } catch (error) {
            console.error('Error clearing warnings:', error);
            message.channel.send('An error occurred while clearing warnings.');
        }
    }
};
