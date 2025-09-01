const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require("discord.js");

// In your ready event or a shared spot, do:
if (!global.lastNowPlaying) global.lastNowPlaying = new Map();

module.exports = {
    event: "trackEnd",
    run: async (client, player, track) => {
        // Retrieve the last now playing message ID for this guild
        try {
            const msgMeta = global.lastNowPlaying.get(player.guildId);
            if (!msgMeta) return;
            const channel = client.channels.cache.get(msgMeta.channelId);
            if (!channel) return;
            let msg;
            try {
                msg = await channel.messages.fetch(msgMeta.messageId);
            } catch {
                return;
            }

            // Disable all old controls and add a Rate button only
            const embed = EmbedBuilder.from(msg.embeds[0]).setFooter({
                text: "Track ended. Rate this track?"
            });
            const rateBtn = new ButtonBuilder()
                .setCustomId(`rate_song_${track.info.identifier}`)
                .setLabel("⭐ Rate")
                .setStyle(ButtonStyle.Primary);

            await msg.edit({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(rateBtn)]
            });

            // Collector for the Rate button only (single use, 3 min)
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: btn =>
                    btn.customId === `rate_song_${track.info.identifier}`,
                max: 1,
                time: 3 * 60 * 1000
            });

            collector.on("collect", async btn => {
                // 5-star rating select
                const starsMenu = new StringSelectMenuBuilder()
                    .setCustomId("select_rating")
                    .setPlaceholder("Select your rating")
                    .addOptions(
                        [5, 4, 3, 2, 1].map(v => ({
                            label: "★".repeat(v) + "☆".repeat(5 - v),
                            value: String(v)
                        }))
                    );
                const starsRow = new ActionRowBuilder().addComponents(
                    starsMenu
                );
                await btn.reply({
                    content: "How would you rate this track out of 5 stars?",
                    components: [starsRow],
                    ephemeral: true
                });

                // Wait for their star selection
                const ratingInteraction = await btn.channel
                    .awaitMessageComponent({
                        componentType: ComponentType.StringSelect,
                        filter: i =>
                            i.user.id === btn.user.id &&
                            i.customId === "select_rating",
                        time: 30_000
                    })
                    .catch(() => null);

                if (!ratingInteraction) return;

                const rating = parseInt(ratingInteraction.values[0]);
                // Prompt for review or skip
                const reviewRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("write_review")
                        .setLabel("Write Review")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("skip_review")
                        .setLabel("Skip")
                        .setStyle(ButtonStyle.Secondary)
                );
                await btn.editReply({
                    content: `You rated this track ${"⭐".repeat(rating)}.`,
                    components: [reviewRow],
                    ephemeral: true
                });

                // Wait for review/skip
                const reviewChoice = await btn.channel
                    .awaitMessageComponent({
                        componentType: ComponentType.Button,
                        filter: i =>
                            i.user.id === btn.user.id &&
                            (i.customId === "write_review" ||
                                i.customId === "skip_review"),
                        time: 30_000
                    })
                    .catch(() => null);

                let review = null;
                if (reviewChoice && reviewChoice.customId === "write_review") {
                    // Show modal for review

                    const modal = new ModalBuilder()
                        .setCustomId("send_review")
                        .setTitle("Write a Review for the Song")
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId("review_text")
                                    .setLabel("Your Review")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                        );
                    await reviewChoice.showModal(modal);
                    const modalSubmit = await reviewChoice
                        .awaitModalSubmit({
                            time: 120_000,
                            filter: m =>
                                m.user.id === btn.user.id &&
                                m.customId === "send_review"
                        })
                        .catch(() => null);

                    if (modalSubmit) {
                        review =
                            modalSubmit.fields.getTextInputValue("review_text");
                        reviewChoice.deleteReply();
                        await modalSubmit.reply({
                            content: "Thank you for your review!",
                            ephemeral: true
                        });
                    }
                } else if (reviewChoice) {
                    await btn.update({
                        content:
                            "No review submitted, thank you for your rating!",
                        ephemeral: true
                    });
                }

                // Send to support server log channel
                const logChannel = client.channels.cache.get(
                    "1411771821983924468"
                );
                if (logChannel) {
                    logChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#ffd700")
                                .setTitle("🎵 Song Rating Received")
                                .addFields(
                                    {
                                        name: "User",
                                        value: `<@${btn.user.id}> (${btn.user.id})(${btn.user.name})`,
                                        inline: true
                                    },
                                    {
                                        name: "Track",
                                        value: `[${track.info.title}](${track.info.uri})`,
                                        inline: true
                                    },
                                    {
                                        name: "Artist",
                                        value: track.info.author,
                                        inline: true
                                    },
                                    {
                                        name: "Guild",
                                        value: player.guildId,
                                        inline: true
                                    },
                                    {
                                        name: "Rating",
                                        value: rating
                                            ? "⭐".repeat(rating)
                                            : "N/A",
                                        inline: true
                                    },
                                    {
                                        name: "Review",
                                        value: review || "No review",
                                        inline: false
                                    }
                                )
                        ]
                    });
                }

                // === (Optional) Save rating to DB or wherever you prefer here ===
                // e.g. await YourRatingModel.create({ userId: btn.user.id, guildId: player.guildId, song: track.info, rating, review });
            });
        } catch (e) {
            console.error(e);
        }
    }
};
