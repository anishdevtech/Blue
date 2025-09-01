/** @format */
const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const config = require("../../../config");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("help")
        .setDescription("View all commands of Blue!"),
    options: {
        cooldown: 15000,
    },

    run: async (client, interaction) => {
        // --- Homepage Embed ---
        const homepageEmbed = new EmbedBuilder()
            .setTitle("💙 Blue - Help Center")
            .setDescription(
                "This bot is dedicated to **Blue Butterfly**.\n\nClick the 🦋 butterfly button below to see a special dedication, or browse the commands."
            )
            .setColor("#1E90FF")
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: "Blue Bot" });

        // --- Dedication Embed ---
        const firstDate = new Date("2024-05-18");
        const today = new Date();
        const diffTime = Math.abs(today - firstDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const dedicationEmbed = new EmbedBuilder()
            .setTitle("💌 For Blue Butterfly")
            .setDescription(
                `From the very first day I saw you, something inside me changed. Every glance, every smile, every small moment left a mark on my heart.  

I wanted to say so much to you, but time and this universe wouldn't let me. And when I tried, the words fell short of what I truly felt.  

Still, every day, my thoughts are with you. Every line of code, every command of this bot, is a quiet way of showing my love.`
            )
            .addFields({ name: "It has been", value: `${diffDays} days` })
            .setColor("#FF69B4")
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: "Made with ❤️ for Blue Butterfly" });

        // --- Build category mapping ---
        const categories = {};
        client.applicationcommandsArray.forEach(cmd => {
            const topCategory = cmd.name;
            categories[topCategory] = cmd.options || [];
        });

        const categoryNames = Object.keys(categories);

        // --- Buttons ---
        const buttonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("dedication")
                .setLabel("🦋 Dedication")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("slash")
                .setLabel("⚡ Commands")
                .setStyle(ButtonStyle.Success)
        );

        // --- Initial Reply ---
        const helpMessage = await interaction.reply({
            embeds: [homepageEmbed],
            components: [buttonsRow],
            fetchReply: true
        });

        const collector = helpMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000
        });

        collector.on("collect", async i => {
            if (i.user.id !== interaction.user.id)
                return i.reply({ content: "❌ This menu is not for you!", ephemeral: true });

            if (i.customId === "dedication") {
                await i.update({ embeds: [dedicationEmbed], components: [buttonsRow] });
            }

            if (i.customId === "slash") {
                // --- Category Select Menu ---
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId("help_category_menu")
                    .setPlaceholder("Select a category...")
                    .addOptions(
                        categoryNames.map(cat => ({
                            label: cat,
                            value: cat,
                            description: `View all subcommands of ${cat}`,
                            emoji: "📁"
                        }))
                    );

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await i.update({ embeds: [homepageEmbed], components: [row, buttonsRow] });
            }
        });

        // --- Category Select Collector ---
        const categoryCollector = helpMessage.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 120000
        });

        categoryCollector.on("collect", async i => {
            if (i.user.id !== interaction.user.id)
                return i.reply({ content: "❌ This menu is not for you!", ephemeral: true });

            const category = i.values[0];
            const subcommands = categories[category];

            if (!subcommands || subcommands.length === 0) {
                return i.update({ embeds: [homepageEmbed], components: [buttonsRow] });
            }

            const embed = new EmbedBuilder()
                .setTitle(`💙 ${category} Commands`)
                .setColor("#00BFFF")
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Blue • ${subcommands.length} subcommands` })
                .addFields(
                    subcommands.map(sub => ({
                        name: `/${category} ${sub.name}`,
                        value: sub.description || "No description provided",
                        inline: false
                    }))
                );

            await i.update({ embeds: [embed], components: [buttonsRow] });
        });

        collector.on("end", async () => {
            await helpMessage.edit({ components: [] });
        });
    },
};