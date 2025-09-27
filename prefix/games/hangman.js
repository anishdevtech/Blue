/** @format */

const { Hangman } = require("discord-gamecord");
const {
	Message,
	PermissionFlagBits,
	ActionRowBuilder,
	StringSelectMenuBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
	structure: {
		name: "hangman",
		description: "",
		aliases: [],
		permissions: null,
	},
	/**
	 * @param {ExtendedClient} client
	 * @param {Message} message
	 * @param {[String]} args
	 */
	run: async (client, message, args, config, argsString) => {
		

		const categories = [
			{ label: "Nature", value: "nature" },
			{ label: "Sport", value: "sport" },
			{ label: "Color", value: "color" },
			{ label: "Camp", value: "camp" },
			{ label: "Fruit", value: "fruit" },
			{ label: "Discord", value: "discord" },
			{ label: "Winter", value: "winter" },
			{ label: "Pokemon", value: "pokemon" },
		];

		const typeRow = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId("select_type")
				.setPlaceholder("Choose the Subject")
				.addOptions(
					categories.map((option) => ({
						label: option.label,
						value: option.value,
					}))
				)
		);
let typemsg = await message.channel.send({components:[typeRow]});

		const collector = typemsg.createMessageComponentCollector({
			time: 60000,
			max:"1"
		});

		collector.on("collect", async (interaction) => {
		  
		  await interaction.message.delete()
		const Game = new Hangman({
			message: message,
			isSlashGame: false,
			embed: {
				title: interaction.values[0]+" "+"Hangman",
				color: client.config.c,
			},
			hangman: {
				hat: "🎩",
				head: "😟",
				shirt: "👕",
				pants: "🩳",
				boots: "👞👞",
			},
			customWord: "",
			timeoutTime: 60000,
			theme: interaction.values[0],
			winMessage: "You won! The word was **{word}**.",
			loseMessage: "You lost! The word was **{word}**.",
			playerOnlyMessage: "Only {player} can use these buttons.",
		});

		Game.startGame();
		});
	},
};
