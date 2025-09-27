const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");
const WarningLimit = require("../../../schemas/WarningLimit.js");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("setwarnlimit")
        .setDescription("Set warning limits for automatic actions")
        .addIntegerOption(option =>
            option
                .setName("kick")
                .setDescription("Warnings needed to kick")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("ban")
                .setDescription("Warnings needed to ban")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("exempt")
                .setDescription("Role IDs to exempt, comma-separated")
                .setRequired(false)
        )
        .addChannelOption(option =>
            option
                .setName("approvalchannel")
                .setDescription("Approvel Channel for kick and ban")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        let exemptRoles = [];
        const kickLimit = interaction.options.getInteger("kick");
        const banLimit = interaction.options.getInteger("ban");

        const approvalchannel =
            interaction.options.getChannel("approvalchannel");
        const approvalchannelId = approvalchannel.id;
        const exemptRolesString =
            interaction.options.getString("exempt") || "none";
        if (exemptRolesString !== "none") {
            let exemptRoles = exemptRolesString
                ? exemptRolesString.split(",").map(role => role.trim())
                : [];
        }
        await WarningLimit.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { kickLimit, banLimit, exemptRoles, approvalchannel:approvalchannelId },
            { upsert: true, new: true }
        );
        const approvalchannelmsg =
            "<#" + interaction.options.getChannel("approvalchannel")?.id + ">";
        return interaction.reply({
            content: `Warning limits set: ${kickLimit} for kick, ${banLimit} for ban. Exempt roles: ${exemptRoles.join(
                ", "
            )}. ${approvalchannel ? approvalchannelmsg : "none"}`
        });
    }
};
