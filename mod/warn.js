const {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");
const Warning = require("../../../schemas/Warning");
const WarningLimit = require("../../../schemas/WarningLimit");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a member")
        .addUserOption(option =>
            option
                .setName("target")
                .setDescription("The member to warn")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Reason for warning")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const target = interaction.options.getUser("target");
        const reason = interaction.options.getString("reason") || "No reason provided";

        try {
            // Fetch or create a warning record
            let warningRecord = await Warning.findOne({
                userId: target.id,
                guildId: interaction.guild.id
            });
            if (!warningRecord) {
                warningRecord = new Warning({
                    userId: target.id,
                    guildId: interaction.guild.id,
                    warnings: []
                });
            }

            // Add new warning
            warningRecord.warnings.push({
                moderatorId: interaction.user.id,
                reason,
                timestamp: new Date()
            });
            await warningRecord.save();

            // Notify the warned user
            try {
                await target.send(`You have been warned in ${interaction.guild.name} by ${interaction.user.tag} for: ${reason}`);
            } catch (error) {
                if (error.code !== 50007) {
                    console.error(`Unexpected error sending DM to ${target.tag}:`, error);
                }
            }

            // Fetch warning limits and exempt roles
            const warningLimits = await WarningLimit.findOne({ guildId: interaction.guild.id });
            const kickLimit = warningLimits?.kickLimit || 5;
            const banLimit = warningLimits?.banLimit || 10;
            const exemptRoles = warningLimits?.exemptRoles || [];
            const approvalChannelId = warningLimits?.approvalChannel;

            // Check for exempt roles
            const member = await interaction.guild.members.fetch(target.id);
            const isExempt = exemptRoles.some(role => member.roles.cache.has(role));
            if (isExempt) return interaction.reply({ content: `${target.tag} is exempt from warnings.`, ephemeral: true });

            // Check bot permissions
            const botMember = interaction.guild.members.cache.get(client.user.id);
            if (!botMember.permissions.has(PermissionFlagsBits.KickMembers) || !botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({ content: "I don't have permission to kick or ban members.", ephemeral: true });
            }

            // Determine action based on warning count
            const warningCount = warningRecord.warnings.length;
            if (!approvalChannelId) {
                if (warningCount >= banLimit) {
                    await interaction.guild.members.ban(target, { reason: "Exceeded warning limit" });
                    return interaction.reply({ content: `${target.tag} has been banned for exceeding ${banLimit} warnings.`, ephemeral: true });
                } else if (warningCount >= kickLimit) {
                    await interaction.guild.members.kick(target, "Exceeded warning limit");
                    return interaction.reply({ content: `${target.tag} has been kicked for exceeding ${kickLimit} warnings.`, ephemeral: true });
                }
            } else {
                const approvalChannel = await interaction.guild.channels.fetch(approvalChannelId).catch(() => null);

                // Ensure the approval channel exists
                if (!approvalChannel) {
                    return interaction.reply({ content: "The specified approval channel does not exist.", ephemeral: true });
                }

                // Send approval request to the specified channel
                const embed = new EmbedBuilder()
                    .setTitle(`Warning Limit Reached for ${target.tag}`)
                    .setDescription(`Warnings: ${warningCount}`)
                    .setColor("#f90000")
                    .addFields(
                        warningRecord.warnings.map((warning, index) => ({
                            name: `Warning ${index + 1}`,
                            value: `**Reason:** ${warning.reason}\n**Moderator:** <@${warning.moderatorId}>\n**Date:** ${new Date(warning.timestamp).toLocaleDateString()}`,
                            inline: false
                        }))
                    );

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("kick").setLabel("Kick").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("ban").setLabel("Ban").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("ignore").setLabel("Ignore").setStyle(ButtonStyle.Secondary)
                );
                const message = await approvalChannel.send({ embeds: [embed], components: [row] });

                const filter = i => ["kick", "ban", "ignore"].includes(i.customId) && i.member.permissions.has(PermissionFlagsBits.Administrator);
                const collector = message.createMessageComponentCollector({ filter, time: 60000 });

                collector.on("collect", async i => {
                    if (i.customId === "kick") {
                        await interaction.guild.members.kick(target, "Exceeded warning limit");
                        await i.update({ content: `${target.tag} has been kicked.`, components: [] });
                    } else if (i.customId === "ban") {
                        await interaction.guild.members.ban(target, { reason: "Exceeded warning limit" });
                        await i.update({ content: `${target.tag} has been banned.`, components: [] });
                    } else {
                        await i.update({ content: "No action taken.", components: [] });
                    }
                });

                return interaction.reply({ content: `Warning added, awaiting admin action for ${target.tag}.`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                return interaction.reply({ content: `An error occurred while warning ${target.tag}.`, ephemeral: true });
            }
        }
    }
};