const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const { time } = require("../../../functions");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Get a user's information.")
        .addUserOption(opt =>
            opt.setName("user").setDescription("The user.").setRequired(false)
        ),
    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const user = interaction.options.getUser("user") || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return await interaction.reply({
                content: "That user is not on the guild."
            });
        }

        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.roles.everyone.id)
            .map(role => role.toString());

        const embed = new EmbedBuilder()
            .setTitle(`User Info - ${user.username}`)
            .setThumbnail(member.displayAvatarURL())
            .setColor("Blurple")
            .addFields(
                { name: "Username", value: user.username },
                {
                    name: "Display Name",
                    value: member.nickname || user.displayName
                },
                { name: "ID", value: user.id },
                {
                    name: "Joined Discord",
                    value: `${time(user.createdTimestamp, "d")} (${time(
                        user.createdTimestamp,
                        "R"
                    )})`
                },
                {
                    name: "Joined Server",
                    value: `${time(member.joinedTimestamp, "d")} (${time(
                        member.joinedTimestamp,
                        "R"
                    )})`
                },
                { name: `Roles [${roles.length}]`, value: roles.join(", ") },
                {
                    name: "In a Voice Channel",
                    value: member.voice.channel ? "Yes" : "No"
                },
                {
                    name: "Guild Owner",
                    value: interaction.guild.ownerId === user.id ? "Yes" : "No"
                },
                {
                    name: "Timed Out",
                    value: member.communicationDisabledUntilTimestamp
                        ? "Yes"
                        : "No"
                }
            );
            
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
              .setName("AvtarUrl")
              .setStyle(ButtonStyle.Link)
              .setUrl(member.AvtarUrl())
              );
            
        await interaction.reply({
          embeds: [embed],
          components:[row]
        });
    }
};
