/** @format */

const {
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} = require("discord.js");

module.exports = {
	structure: {
		name: "ticketsetup",
		description: "Set up a ticket system",
		aliases: [],
		permissions: null,
	},
	/**
	 * @param {ExtendedClient} client
	 * @param {Message} message
	 * @param {[String]} args
	 */
	run: async (client, message, args) => {
		const embedColor = client.config.c;
		const footerText = client.config.f;
		let data = {};
		const embed = new EmbedBuilder()
			.setColor(embedColor)
			.setFooter(footerText);

		try {
			// Ask user for button or select menu support
			embed.setDescription(
				"Do you want to set up button support or a selection menu? select `button` or `menu`."
			);
			const supportMessage = await message.channel.send({
				embeds: [embed],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setLabel("Button")
							.setStyle(ButtonStyle.Primary)
							.setCustomId("button"),
						new ButtonBuilder()
							.setLabel("Selection Menu")
							.setStyle(ButtonStyle.Primary)
							.setCustomId("menu")
					),
				],
			});
const filter = (click) => click.user.id === message.author.id;
		const btncollector =
			message.channel.createMessageComponentCollector({
				max: "1", // The number of times a user can click on the button
				time: "10000", // The amount of time the collector is valid for in milliseconds,
				filter, // Add the filter
			});

		btncollector.on("collect",async (btn)=>{
		  let choice = btn.customId
			if (choice === "button") {
				data.type = "button";
				// Ask for button name
				embed.setDescription("Enter the name for the button.");
				await supportMessage.edit({ embeds: [embed] });
				const nameCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const buttonName = nameCollected.first().content;
				data.buttonname = buttonName;
				await dlt(nameCollected);
				// Ask for emoji
				embed.setDescription(
					"Enter the emoji you want to use for the button."
				);
				await supportMessage.edit({ embeds: [embed] });
				const emojiCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const emoji = emojiCollected.first().content;
				data.buttonEmoji = emoji;
				await dlt(emojiCollected);

				// Ask for ticket moderator role
				embed.setDescription(
					"Mention or provide the ID of the role for ticket moderators."
				);
				await supportMessage.edit({ embeds: [embed] });
				const roleCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const moderatorRole =
					roleCollected.first().mentions.roles.first() ||
					message.guild.roles.cache.get(
						roleCollected.first().content
					);
				data.moderator = moderatorRole;

				await dlt(roleCollected);

				// Ask for category ID
				embed.setDescription(
					"Enter the ID of the category where tickets will be created."
				);
				await supportMessage.edit({ embeds: [embed] });
				const categoryCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const categoryID = categoryCollected.first().content;
				data.category = categoryID;

				await dlt(categoryCollected);

				// Ask for support channel ID
				embed.setDescription(
					"Enter the ID of the channel where the support message will go."
				);
				await supportMessage.edit({ embeds: [embed] });
				const channelCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const supportChannel =
					message.mentions.channels.first() ||
					message.guild.channels.cache.get(channelCollected);
				data.channel = supportChannel.id;

				await dlt(supportChannel);

				// Continue with the rest of the setup process...
			} else if (choice === "menu") {
				data.type = "menu";
				// Ask for total number of options
				embed.setDescription(
					"Enter the total number of options for the selection menu (maximum 25)."
				);
				await supportMessage.edit({ embeds: [embed] });
				const totalOptionsCollected =
					await message.channel.awaitMessages({
						max: 1,
						time: 60000,
						errors: ["time"],
					});
				const totalOptions = parseInt(
					totalOptionsCollected.first().content
				);

				if (
					isNaN(totalOptions) ||
					totalOptions < 1 ||
					totalOptions > 25
				) {
					embed.setDescription(
						"Invalid input. Please enter a number between 1 and 25."
					);
					await supportMessage.edit({ embeds: [embed] });
					return;
				}

				await dlt(totalOptionsCollected);

				// Ask for options one by one
				let options = [];
				let embedFields = [];

				for (let i = 0; i < totalOptions; i++) {
					embed.setDescription(`Enter option ${i + 1}.`);

					const optionCollected = await message.channel.awaitMessages(
						{ max: 1, time: 60000, errors: ["time"] }
					);
					const option = optionCollected.first().content;
					options.push(option);
					embedFields.push({
						name: `Option ${i + 1}`,
						value: option,
					});

					await dlt(optionCollected);
					if (embedFields.length > 0) {
						embed.setFields(embedFields);
					}

					await supportMessage.edit({ embeds: [embed] });
				}

				data.options = options;
				// Ask for ticket moderator role
				embed.setDescription(
					"Mention or provide the ID of the role for ticket moderators."
				);
				embed.setFields();
				await supportMessage.edit({ embeds: [embed] });
				const roleCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});

				const moderatorRole =
					roleCollected.first().mentions.roles.first() ||
					message.guild.roles.cache.get(
						roleCollected.first().content
					);
				data.moderator = moderatorRole?.id;
				await dlt(roleCollected);

				// Ask for category ID
				embed.setDescription(
					"Enter the ID of the category where tickets will be created."
				);
				await supportMessage.edit({ embeds: [embed] });
				const categoryCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const categoryID = categoryCollected.first().content;
				data.category = categoryID;
				await dlt(categoryCollected);

				// Ask for support channel ID
				embed.setDescription(
					"Enter the ID of the channel where the support message will go."
				);
				await supportMessage.edit({ embeds: [embed] });
				const channelCollected = await message.channel.awaitMessages({
					max: 1,
					time: 60000,
					errors: ["time"],
				});
				const supportChannelID = channelCollected.first().content;
				data.channel = supportChannelID;
				await dlt(channelCollected);
				// Continue with the rest of the setup process...
			}
		})
			console.log(data);
			// Continue with the rest of the setup process...
			async function dlt(msgs) {
				await msgs.first().delete();
			}
		} catch (error) {
			console.error(error);
			embed.setDescription(
				"An error occurred while setting up the ticket system."
			);
		
			message.channel.send(embed);
		}
	},
};
