/** @format */

const {
	ButtonInteraction,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");
module.exports = {
	Welcome_Setup_Message,
};
async function Welcome_Setup_Message(client, interaction, db) {
	let base;
	let message;

	const currentdata = await db.findOne({ guild: interaction.guild.id });
	let olddatamessage = await replaceVariables(
		currentdata?.data?.message,
		interaction.user,
		interaction.guild.name,
		interaction.guild.ownerId,
		interaction
	);
	const welcomeEmbedText = olddatamessage
		? "Current setup:\n" + olddatamessage
		: "No setup found";
	const welcomeEmbed = new EmbedBuilder()
		.setTitle("Welcome Message Setup")
		.setColor(client.config.c)
		.setFooter(client.config.f)
		.setDescription(welcomeEmbedText); // Display current setup or indicate no setup

	const optionsEmbed = new EmbedBuilder()
		.setTitle("Available Variables")
		.setColor(client.config.c)
		.setFooter(client.config.f).setDescription(`
        {username} - User's username
        {usertag} - User's usernamID
        {userTimestamp} - Timestamp when the user added to this guild 
        {UserInvitedBy} - Tag of the Person who invited the User
        {useraccountAge} - User's account age (in days)
        {userId} - User's ID
        {guildId} - Guild's ID
        {guildname} - Guild's name
        {guildAge} - Guild's age (in days)
        {GuildOwnername} - Guild owner's username
        {GuildOwnerId} - Guild owner's ID
        {GuildOwnertag} - Guild owner's username 
        
      `);

	const buttonRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("welcome_change_setup")
			.setLabel("Change Setup")
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId("welcome_save_setup")
			.setLabel("Save Setup")
			.setStyle(ButtonStyle.Success)
	);

	await interaction.reply({
		content:
			"Kindly Send a message using the Variables mentioned below for **Welcome Message** /n example: Hi,{Username} Welcome to {GuildName}",
		embeds: [welcomeEmbed, optionsEmbed],
	});

	const filter = (m) => m.author.id === interaction.user.id; // Only accept messages from the user who clicked the button
	const collector = interaction.channel.createMessageCollector({
		filter,
		time: 10 * 60 * 1000,
	}); // 15-second timeout

	collector.on("collect", async (message) => {
		const newSetup = message.content;
		let preview = await replaceVariables(
			newSetup,
			interaction.user,
			interaction.guild.name,
			interaction.guild.ownerId,
			interaction
		);
		
		await message.delete();
		message = newSetup;
		await collector.stop(); // Stop collector after message is received
		const confirmationEmbed = new EmbedBuilder()
			.setTitle("Preview")
			.setDescription(preview);

		const confirmationButtonRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId("welcome_message_confirm_save")
				.setLabel("Confirm Save")
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId("welcome_cancel")
				.setLabel("Cancel")
				.setStyle(ButtonStyle.Danger)
		);

		await interaction.editReply({
			embeds: [confirmationEmbed],
			components: [confirmationButtonRow],
			ephemeral: true,
		});
		const filter = (click) => click.user.id === interaction.user.id;
		const btncollector =
			interaction.channel.createMessageComponentCollector({
				max: "1", // The number of times a user can click on the button
				time: "10000", // The amount of time the collector is valid for in milliseconds,
				filter, // Add the filter
			});

		btncollector.on("collect", async (btn) => {
			if (btn.isButton()) {
				await client.buttonDisable(btn);
				switch (btn.customId) {
					case "welcome_message_confirm_save":
						base = await db.findOne({
							guild: interaction.guild.id,
						});
						if (!base) {
							base = await new db({
								guild: interaction.guild.id,
							});
						}
						base.data = { message: message };

						await base.save();
						btn.reply({
							embeds: [
								new EmbedBuilder()
									.setColor(client.config.c)
									.setFooter(client.config.f)
									.setDescription("Thanks For Confirming"),
							],
						});
						break;
					case "welcome_message_retrsetColor":
						btn.reply({
							embeds: [
								new EmbedBuilder()
									.setColor(client.config.c)
									.setFooter(client.config.f)
									.setDescription(
										"You want to Retry. Going with that"
									),
							],
						});
						break;
					case "welcome_message_cancel":
						btn.reply({
							embeds: [
								new EmbedBuilder()
									.setColor(client.config.c)
									.setFooter(client.config.f)
									.setDescription(
										"Cancelling on your request"
									),
							],
						});

						break;
				}
			}
		});

		btncollector.on("end", async (collected) => {
			if (collected.size === 0) {
				await btn.editReply({
					content: "Setup timed out.",
					components: [],
					ephemeral: true,
				});
			}
		});
	});
	collector.on("end", async (collected) => {
		if (collected.size === 0) {
			await interaction.editReply({
				content: "Setup timed out.",
				components: [],
				ephemeral: true,
			});
		}
	});
}
function replaceVariables(
	message,
	interactionUser,
	guildName,
	guildOwner,
	int
) {
	// Calculate account age in days

	// Define the mappings of variables to replacements
	const variableMappings = {
		"{username}": interactionUser.username,
		"{usertag}": `<@${interactionUser.id}>`,
		"{userTimestamp}": interactionUser.joinedAt,
		"{UserInvitedBy}": interactionUser.inviter,

		"{userId}": interactionUser.id,
		"{guildId}": int.guild.id,
		"{guildname}": guildName,

		"{GuildOwnername}": guildOwner.username,
		"{GuildOwnerId}": guildOwner,
		"{GuildOwnertag}": `<@${guildOwner}>`,
	};

	// Replace variables in the message
	for (const variable in variableMappings) {
		if (variableMappings.hasOwnProperty(variable)) {
			message = message.replace(variable, variableMappings[variable]);
		}
	}

	return message;
}
