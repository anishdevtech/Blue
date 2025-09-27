const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");
const Warning = require("../../../schemas/Warning");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("unwarn")
        .setDescription("Remove a specific warning from a member")
        .addUserOption(option =>
            option
                .setName("target")
                .setDescription("The member to remove the warning from")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("index")
                .setDescription("The index of the warning to remove")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const target = interaction.options.getUser("target");
        const index = interaction.options.getInteger("index");

        const warningRecord = await Warning.findOne({
            userId: target.id,
            guildId: interaction.guild.id
        });

        if (!warningRecord || warningRecord.warnings.length <= index) {
            return interaction.reply({
                content: "Invalid warning index.",
                ephemeral: true
            });
        }

        warningRecord.warnings.splice(index, 1);

        if (warningRecord.warnings.length === 0) {
            await Warning.deleteOne({
                userId: target.id,
                guildId: interaction.guild.id
            });
        } else {
            await warningRecord.save();
        }

        return interaction.reply({
            content: `Successfully removed warning ${index + 1} from ${
                target.tag
            }`
        });
    }
};
