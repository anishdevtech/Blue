const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("exportemojis")
        .setDescription("Exports all custom emojis of the server as an array."),
    options: {
        developers: true, // Restrict to developers only
    },

    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction<true>} interaction
     */
    run: async (client, interaction) => {
        try {
            const guild = interaction.guild;
            if (!guild) {
                return interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
            }

            // Fetch all custom emojis from the guild
            const emojis = await guild.emojis.fetch();
            const emojiArray = emojis.map(e => e.toString()); // Convert each emoji to its string representation

            // Format the emoji array as a JSON string
            const emojiArrayString = JSON.stringify(emojiArray, null, 2);

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle(`Server Emojis (${emojiArray.length})`)
                .setDescription(`\`\`\`json\n${emojiArrayString}\n\`\`\``) // Embed with code block
                .setColor("Blue")
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            // Check if the embed description exceeds the character limit
            if (embed.data.description.length > 4096) {
                embed.setDescription("❌ Too many emojis to display in embed!");
            }

            // Send the embed
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: `❌ Failed to export emojis: ${error.message}`, ephemeral: true });
        }
    },
};