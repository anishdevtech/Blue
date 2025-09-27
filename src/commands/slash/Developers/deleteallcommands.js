const { SlashCommandBuilder, ChatInputCommandInteraction } = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("deleteallcommands")
        .setDescription("Deletes all application commands of this bot, excluding its own."),
    options: {
        developers: true, // only allow devs to run this
    },

    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction<true>} interaction
     */
    run: async (client, interaction) => {
        try {
            const rest = new REST({ version: "10" }).setToken(client.token);

            // Fetch all global commands
            const globalCommands = await rest.get(Routes.applicationCommands(client.user.id));

            // Filter out the bot's own commands to avoid deletion
            const commandsToDelete = globalCommands.filter(
                (command) => command.name !== 'deleteallcommands'
            );

            // Delete the filtered commands
            await Promise.all(
                commandsToDelete.map((command) =>
                    rest.delete(Routes.applicationCommand(client.user.id, command.id))
                )
            );

            await interaction.reply({
                content: `✅ Successfully deleted ${commandsToDelete.length} application commands, excluding its own.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `❌ Failed to delete commands: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};