/** @format */

const {
	SelectMenuInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../class/ExtendedClient");
const webSocket = require("ws"); // Import WebSocket library

module.exports = {
	customId: "welcome_setup_image",
	async run(client, interaction) {
		let ws = client.websocket;
		const selectOptions = [
			{
				name: "Option 1",
				index: "1",
				image: "https://media.discordapp.net/attachments/1219160078070976535/1219722049799589969/pexels-simon-berger-1323550.jpg",
			},
			{
				name: "Option 2",
				index: "2",
				image: "https://media.discordapp.net/attachments/1219160078070976535/1219722049199800320/pexels-asad-photo-maldives-3293148.jpg",
			},
			{
				name: "Option 3",
				index: "3",
				image: "https://media.discordapp.net/attachments/1219160078070976535/1219722048557813831/pexels-jeremy-bishop-2397414.jpg",
			},
			{
				name: "Option 4",
				index: "4",
				image: "https://media.discordapp.net/attachments/1219160078070976535/1219722047966674944/pexels-philippe-donn-1242764.jpg",
			},
			// Add more options as needed
		];

		const selectOptionsBuilder = selectOptions.map((option) =>
			new StringSelectMenuOptionBuilder()
				.setLabel(option.name)
				.setValue(option.index)
				.setDescription("Click to select this image")
		);

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId("welcome_select_image")
			.setPlaceholder("Select a background")
			.addOptions(selectOptionsBuilder);

		const row = new ActionRowBuilder().addComponents(selectMenu);

		await interaction.reply({
			content: "Please select a background for the welcome message:",
			components: [row],
		});

		const filter = (i) =>
			i.user.id === interaction.user.id &&
			i.customId === "welcome_select_image";
		const collector = interaction.channel.createMessageComponentCollector({
			filter,
			time: 2 * 60 * 1000,
		});

		collector.on("collect", async (i) => {
			const selectedOption = selectOptions.find(
				(option) => option.index === i.values[0]
			);
			try {
			  const canvafy = require("canvafy");
				const welcome = await new canvafy.WelcomeLeave()
					.setAvatar(
						message.author.displayAvatarURL({
							forceStatic: true,
							extension: "png",
						})
					)
					.setBackground(
						"image",
						selectOptions
					)
					.setTitle("Welcome")
					.setDescription(
						"Welcome to this server, go read the rules please!"
					)
					.setBorder("#2a2e35")
					.setAvatarBorder("#2a2e35")
					.setOverlayOpacity(0.3)
					.build();
				const embed = new EmbedBuilder()
					.setTitle("Welcome Image Setup")
					.setImage(image) // Use the received image URL
					.setColor("#0099ff");

				const applyButton = new ButtonBuilder()
					.setCustomId("welcome_apply_image_btn")
					.setLabel("Apply")
					.setStyle(ButtonStyle.Success);

				const applyRow = new ActionRowBuilder().addComponents(
					applyButton
				);

				i.update({
					content:
						'If you like this image, click "Apply" to set it as the welcome image.',
					embeds: [embed],
					components: [row, applyRow],
				});

				// Handling apply button click
				const applyFilter = (btnInteraction) =>
					btnInteraction.user.id === interaction.user.id &&
					btnInteraction.customId === "welcome_apply_image_btn";
				const applyCollector =
					interaction.channel.createMessageComponentCollector({
						applyFilter,
						time: 2 * 60 * 1000,
					});

				applyCollector.on("collect", async (btnInteraction) => {
					if (btnInteraction.customId !== "welcome_apply_image_btn")
						return;

					// Logic to apply the selected image goes here
					await btnInteraction.update({
						content: "Welcome image applied successfully!",
						components: [],
					});
					applyCollector.stop();
				});
			} catch (error) {
				console.error("Error parsing server response:", error);
			}
		});

		collector.on("end", (int) => {
			interaction.followUp({
				content:
					"You took too long to make a selection. Please try again.",
			});
		});
	},
};
