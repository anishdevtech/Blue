/** @format */

const { ButtonStyle } = require("discord.js");
// Import necessary modules and classes
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const { Message, PermissionFlagBits } = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
    structure: {
        name: "purge",
        description: "Delete messages",
        aliases: ["clear"],
        permissions: ["ManageMessages"]
    },
    /**
     * @param {ExtendedClient} client
     * @param {Message} message
     * @param {[String]} args
     */
    run: async (client, message, args,config) => {
        // Check if the user has provided a valid number of messages to purge
        try {
            const amount = parseInt(args[0]) || 1;

            if (isNaN(amount) || amount <= 0) {
                return message.reply(
                    "Please provide a valid number of messages to delete."
                );
            }

            // Create an embed with buttons
            const embed = {
                color: config.config.c,
                title: "Purge Command",
                description: `You are about to delete ${amount} messages. Choose the type of purge:`,
                fields: []
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("public_purge")
                    .setLabel("Public Purge")
                  //  .setDisable(data.toggle ? false : true)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("user_specific_purge")
                    .setLabel("User Specific Purge")
                    .setStyle(ButtonStyle.Primary)
            );
            client.temdb.set(`purge_${message.guild.id}`, {
                amount: amount,
                message: message,
                user: message.author
            });
            // Send the embed with buttons
            let msg = await message.channel.send({
                embeds: [embed],
                components: [row]
            });
            await setTimeout(async () => {
                await msg?.delete();
            }, 15000);
        } catch (e) {
          console.error(e)
        }
    }
};
