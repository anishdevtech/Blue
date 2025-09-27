const { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder 
} = require('discord.js');
const mongoose = require('mongoose');
const TicketPanel = require('../../../schemas/Ticket-panel.js'); // Adjust the path as needed

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('addpanel')
        .setDescription('Add a new ticket panel')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('Name of the panel')
                .setRequired(true)
        )
        .addRoleOption(option => 
            option.setName('adminrole')
                .setDescription('Admin role that can manage this panel')
                .setRequired(true)
        ),
    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const panelName = interaction.options.getString('name');
        const adminRole = interaction.options.getRole('adminrole');

        try {
            // Create a new ticket panel instance
            const newPanel = new TicketPanel({
                name: panelName,
                adminRole: adminRole.id,
            });

            // Save the new panel to the database
            await newPanel.save();

            const successEmbed = new EmbedBuilder()
                .setTitle('Panel Added')
                .setDescription(`Successfully added a new panel: **${panelName}**`)
                .addFields(
                    { name: 'Admin Role', value: adminRole.toString(), inline: true }
                );

            await interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error saving the panel to the database.', ephemeral: true });
        }
    }
};
