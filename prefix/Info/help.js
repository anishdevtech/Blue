const { ButtonStyle } = require("discord.js");
const {
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    PermissionsBitField,
    EmbedBuilder,
} = require("discord.js");
const config = require("../../../config");
const GuildSchema = require("../../../schemas/GuildSchema");

module.exports = {
    structure: {
        name: "help",
        description: "View all the possible commands!",
        aliases: ["h"],
        cooldown: 15000,
    },
    /**
     * @param {ExtendedClient} client
     * @param {Message<true>} message
     * @param {string[]} args
     */
    run: async (client, message, args) => {
        let prefix = config.handler.prefix;
 
        if (config.handler?.mongodb?.enabled) {
            try {
                const data = await GuildSchema.findOne({
                    guild: message.guildId,
                });

                if (data && data?.prefix) prefix = data.prefix;
            } catch {
                prefix = config.handler.prefix;
            }
        }

        // Create main homepage embed with detailed information about the bot
        const homepageEmbed = new EmbedBuilder()
            .setTitle("<:Milanio:1225426626557509724>Milanio Bot - Help")
            .setDescription(
                ">>> <:Welcome:1225435188289601556>****Welcome to Milanio Bot!**** Below you will find all the available commands and features.\n**Use the buttons below to navigate through different sections.**"
            )
            .addFields(
                {
                    name: "**__<:Info:1225427199830528071>Bot Information__**",
                    value: "> **Milanio Bot is a multi-purpose Discord bot designed to enhance your server experience.**",
                },
                {
                    name: "**__<:version:1225427546838007894>Bot Version__**",
                    value: `> **Version: ${config.bot.version || "2.0.0-alpha"}**`,
                },
                {
                    name: "**__<:djs:1225428267951980646>Discord Wrapper__**",
                    value: `> **discord.js@14.14.01**`,
                }
            )
            .setFooter(client.config.f)
            .setColor(client.config.c)

        let s = [];
        let p = [];
        let remainingS = [];
        let remainingP = [];

        // Dynamically add slash commands to the embed
        const slashCommands = client.applicationcommandsArray.map((command) =>
            s.push({
                name: command.name,
                value: command.description || "description not found",
            })
        );

        // Dynamically add prefix commands to the embed
        const prefixCommands = client.collection.prefixcommands.map((command) =>
            p.push({
                name: command.structure.name,
                value: command.structure.description || "description not found",
            })
        );
        // Check if there are more than 25 objects in s, slice them and move the remaining to remainingS
        if (s.length > 25) {
            remainingS = s.slice(25);
            s = s.slice(0, 25);
        }

        // Check if there are more than 25 objects in p, slice them and move the remaining to remainingP
        if (p.length > 25) {
            remainingP = p.slice(25);
            p = p.slice(0, 25);
        }
          const prefixEmbed = new EmbedBuilder()
            .setTitle("Milanio Bot - Help")
            .setColor(client.config.c)
            .setFooter(client.config.f)
      
        prefixEmbed.addFields(p);
         const SlashEmbed = new EmbedBuilder()
            .setTitle("Milanio Bot - Help")
              .setColor(client.config.c)
            .setFooter(client.config.f)
            .addFields(s);

        // Create buttons for different pages
        const slashButton = new ButtonBuilder()
            .setLabel("SlashCommands")
            .setEmoji("1225431188068503554")
            
            .setStyle(ButtonStyle.Primary)
            .setCustomId("slash_commands");

        const prefixButton = new ButtonBuilder()
            .setLabel("PrefixCommands(?)")
            .setEmoji("1225433386676523081")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("prefix_commands");

        const homepageButton = new ButtonBuilder()
            .setLabel(" ")
            .setEmoji("1225433898880733255")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("homepage");

        const nextButton = new ButtonBuilder()
            .setLabel("⏭️")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("next_page");

        const previousButton = new ButtonBuilder()
            .setLabel("⏮️")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId("previous_page");

        let currentPage = 1;

       

        const row = new ActionRowBuilder().addComponents(
            slashButton,
            homepageButton,
            prefixButton,
        );

        const helpMessage = await message.reply({
            embeds: [homepageEmbed],
            components: [row],
        });

        const collector = helpMessage.createMessageComponentCollector({
            time: 60000,
        });

        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== message.author.id) return;

            switch (interaction.customId) {
                case "slash_commands":
                  interaction.update({embeds:[SlashEmbed],components:[new ActionRowBuilder().addComponents(nextButton,homepageButton,previousButton)]});
                  break;
                case "prefix_commands":
                  
                  interaction.update({embeds:[prefixEmbed],components:[new ActionRowBuilder().addComponents(nextButton,homepageButton,previousButton)]});
                  break;
                case "homepage":
                    currentPage = 1;
                    slashButton.setLabel(`Slash Commands (${currentPage})`);
                    prefixButton.setLabel(`Prefix Commands (${currentPage})`);
                    await interaction.update({
                        embeds: [homepageEmbed],
                        components: [row],
                    });
                    break;
                case "next_page":
                    currentPage++;
                    slashButton.setLabel(`Slash Commands (${currentPage})`);
                    prefixButton.setLabel(`Prefix Commands (${currentPage})`);
                    if (currentPage === 2) {
                        homepageEmbed.fields = [];
                        homepageEmbed.addFields(remainingS);
                        homepageEmbed.addFields(remainingP);
                    }
                    await interaction.update({
                        embeds: [homepageEmbed],
                        components: [row],
                    });
                    break;
                case "previous_page":
                    currentPage--;
                    slashButton.setLabel(`Slash Commands (${currentPage})`);
                    prefixButton.setLabel(`Prefix Commands (${currentPage})`);
                    if (currentPage === 1) {
                        homepageEmbed.fields = [];
                        homepageEmbed.addFields(s);
                        homepageEmbed.addFields(p);
                    }
                    await interaction.update({
                        embeds: [homepageEmbed],
                        components: [row],
                    });
                    break;
                default:
                    break;
            }
        });

        collector.on("end", () => {
            helpMessage.edit({ components: [] });
        });
    },
};
