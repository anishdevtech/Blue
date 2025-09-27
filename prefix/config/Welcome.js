/** @format */

const { ButtonStyle } = require("discord.js");
const {
    Message,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const GuildSchema = require("../../../schemas/welcome.js");

module.exports = {
    structure: {
        name: "welcome",
        description: "Sets up a customizable welcome message system.",
        aliases: [],
        permissions: "ManageGuild"
    },
    /**
     * @param {ExtendedClient} client
     * @param {Message} message
     * @param {*} args
     */
    run: async (client, message,args, config) => {
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("welcome_setup")
                .setLabel("Setup")

                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("welcome_preview")
                .setLabel("Preview")
                .setStyle(ButtonStyle.Secondary)
        );
        const setup_embed = new EmbedBuilder()
            .setDescription("Welcome message configuration options:")
            .setFields(
                {
                    name: "Setup",
                    value: "You can edit the Configuration Such as Message Image DmMessage Integration. "
                },
                {
                    name: "Preview",
                    value: "You can preview how the message would look when system in function. "
                }
            )
            .setColor(config.bot.c)
            .setFooter(config.bot.f);

        await message.reply({
            embeds: [setup_embed],
            components: [buttonRow]
        });
    }
};
