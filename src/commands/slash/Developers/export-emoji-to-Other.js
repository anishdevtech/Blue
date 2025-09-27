const {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
    EmbedBuilder
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

/*
Run this command IN the DESTINATION guild.
It will:
- Show a select menu of mutual guilds (bot ∩ developer) to choose the SOURCE guild.
- Fetch emojis from the source guild.
- Create those emojis in the current (destination) guild up to capacity.
*/

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("importemojis")
        .setDescription(
            "Import emojis from another server into this server (destination)."
        ),
    options: {
        developers: true // keep your developer-only gate
    },

    /**
     * @param {ExtendedClient} client
     * @param {ChatInputCommandInteraction<true>} interaction
     */
    run: async (client, interaction) => {
        // Must be executed in a guild (destination)
        const destGuild = interaction.guild;
        if (!destGuild) {
            return interaction.reply({
                content: "Run this in the destination server.",
                ephemeral: true
            });
        }

        // Check bot permission to create emojis in destination
        const me = await destGuild.members.fetchMe();
        if (!me.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return interaction.reply({
                content:
                    'Missing "Manage Emojis and Stickers" permission in this server.',
                ephemeral: true
            });
        }

        // Build list of mutual guilds (candidate SOURCE guilds), excluding the current one
        const mutualGuilds = [];
        for (const [, g] of client.guilds.cache) {
            if (g.id === destGuild.id) continue;
            try {
                await g.members.fetch(interaction.user.id); // only keep guilds where invoker is a member
                mutualGuilds.push(g);
            } catch {
                // not mutual
            }
        }

        if (mutualGuilds.length === 0) {
            return interaction.reply({
                content:
                    "No mutual source servers found with the developer and the bot.",
                ephemeral: true
            });
        }

        const options = mutualGuilds.slice(0, 25).map(g => ({
            label: g.name.length > 100 ? g.name.slice(0, 97) + "..." : g.name,
            value: g.id
        }));

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("source_guild")
                .setPlaceholder("Select a source server to export emojis from")
                .addOptions(options)
        );

        const prompt = await interaction.reply({
            content: "Select the source server to import emojis from:",
            components: [row],
            ephemeral: true,
            fetchReply: true
        }); // fetchReply allows awaiting component on this message [7]

        // Wait for the selection by the same user
        const select = await prompt
            .awaitMessageComponent({
                componentType: ComponentType.StringSelect,
                time: 60_000,
                filter: i =>
                    i.user.id === interaction.user.id &&
                    i.customId === "source_guild"
            })
            .catch(() => null);

        if (!select) {
            return interaction.editReply({
                content: "Timed out waiting for selection.",
                components: []
            });
        }

        const sourceGuildId = select.values[0];
        const sourceGuild = client.guilds.cache.get(sourceGuildId);
        if (!sourceGuild) {
            await select.update({
                content: "Could not access selected source server.",
                components: []
            });
            return;
        }

        // Update UI and remove menu
        await select.update({
            content: `Source selected: ${sourceGuild.name}. Fetching emojis and importing...`,
            components: []
        });

        // Fetch emojis from source and destination
        const sourceEmojis = await sourceGuild.emojis.fetch().catch(() => null);
        if (!sourceEmojis || sourceEmojis.size === 0) {
            return interaction.followUp({
                content: "No custom emojis in the source server.",
                ephemeral: true
            });
        }

        const destEmojis = await destGuild.emojis.fetch().catch(() => null);
        const destStaticCount = destEmojis
            ? destEmojis.filter(e => !e.animated).size
            : 0;
        const destAnimatedCount = destEmojis
            ? destEmojis.filter(e => e.animated).size
            : 0;

        // Soft defaults; API/boosts may allow more — failures will be handled per-create
        const DEFAULT_STATIC_LIMIT = 50;
        const DEFAULT_ANIM_LIMIT = 50;

        let staticRemaining = Math.max(
            0,
            DEFAULT_STATIC_LIMIT - destStaticCount
        );
        let animRemaining = Math.max(0, DEFAULT_ANIM_LIMIT - destAnimatedCount);

        const results = [];

        for (const [, emoji] of sourceEmojis) {
            const isAnim = Boolean(emoji.animated);
            if (isAnim && animRemaining <= 0) {
                results.push(
                    `Skip ${emoji.name} (animated): no remaining animated slots`
                );
                continue;
            }
            if (!isAnim && staticRemaining <= 0) {
                results.push(
                    `Skip ${emoji.name} (static): no remaining static slots`
                );
                continue;
            }

            // Use imageURL() in v14 (url is deprecated) [8]
            const attachment = emoji.imageURL({ size: 256 }); // small size is enough and under file limits
            const safeName = (emoji.name || "emoji")
                .toLowerCase()
                .replace(/[^a-z0-9_]/gi, "_")
                .slice(0, 30);

            try {
                const created = await destGuild.emojis.create({
                    attachment,
                    name: safeName
                }); // [9]
                results.push(
                    `Added :${created.name}: (${
                        isAnim ? "animated" : "static"
                    })`
                );
                if (isAnim) animRemaining -= 1;
                else staticRemaining -= 1;
            } catch (err) {
                results.push(
                    `Failed ${emoji.name}: ${err.message ?? String(err)}`
                );
            }
        }

        const added = results.filter(r => r.startsWith("Added")).length;
        const failed = results.filter(r => r.startsWith("Failed")).length;
        const skipped = results.filter(r => r.startsWith("Skip")).length;

        const report = new EmbedBuilder()
            .setTitle("Emoji Import Report")
            .setDescription(
                [
                    `Source: ${sourceGuild.name}`,
                    `Destination: ${destGuild.name}`,
                    `Added: ${added}`,
                    `Failed: ${failed}`,
                    `Skipped (capacity): ${skipped}`
                ].join("\n")
            )
            .setColor(0x2b2d31)
            .setTimestamp();

        await interaction.channel.send({ embeds: [report] });

        // Send results in chunks to avoid length limits
        const chunk = (arr, size) => {
            const out = [];
            for (let i = 0; i < arr.length; i += size)
                out.push(arr.slice(i, i + size));
            return out;
        };
        const chunks = chunk(
            results.length ? results : ["No emojis processed."],
            20
        );
        for (const c of chunks) {
            await interaction.channel.send({
                content: "• " + c.join("\n• ")
            });
        }
    }
};
