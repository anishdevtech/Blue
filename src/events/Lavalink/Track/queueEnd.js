const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const MelodyBoard = require("../../../schemas/MelodyBoard");
const updateMelodyBoardPanel = require("../../../Functions/Melody/updateMelodyBoardPanel.js");
const { buildPlayAgainRow } = require("../../../Functions/PlayAgain.js");
// CONFIG: feedback log channel
const FEEDBACK_LOG_CHANNEL_ID = "1411771821983924468";
async function UpdatePlayMsg(client, player) {
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
        const track = player.queue.previous;
        

        const identifier = track[0]?.info?.identifier || "unknown";

        await msg.edit({
            components: [buildPlayAgainRow(player.guildId, identifier)] // replace all prior controls
        });
    } catch (e) {
        console.error(e);
    }
}
// UI builders
function buildStartRow(sessionId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`qexp_start_${sessionId}`)
            .setLabel("Rate experience")
            .setStyle(ButtonStyle.Primary)
    );
}

function buildRatingMenu(sessionId) {
    const opts = [1, 2, 3, 4, 5].map(n => ({
        label: `${"★".repeat(n)}${"☆".repeat(5 - n)} (${n})`,
        value: String(n),
        description: n === 1 ? "Very poor" : n === 5 ? "Excellent" : " "
    }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`qexp_select_${sessionId}`)
            .setPlaceholder("Select a rating 1–5")
            .addOptions(opts)
    );
}

function buildReviewRow(sessionId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`qexp_review_yes_${sessionId}`)
            .setLabel("Add review")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`qexp_review_no_${sessionId}`)
            .setLabel("Skip")
            .setStyle(ButtonStyle.Secondary)
    );
}

module.exports = {
    event: "queueEnd",
    run: async (client, player) => {
        console.log(player);
        try {
            const channel = client.channels.cache.get(player.textChannelId);
            if (!channel || !channel.send) return;

            // Update any pinned panel UI
            updateMelodyBoardPanel(player.guildId, client); // optional UI refresh [6][14]
            const mb = await MelodyBoard.findOne({ guildId: player.guildId });

            const isMelodyBoard =
                mb &&
                mb.channelId &&
                mb.panelMessageId &&
                player.textChannelId === mb.channelId;
            
        const msgMeta = global.lastNowPlaying.get(player.guildId);
        if(!msgMeta)return;
            UpdatePlayMsg(client, player);

            const sessionId = `${player.guildId}-${Date.now()}`;
            const baseEmbed = new EmbedBuilder()
                .setColor("#5865F2")
                .setTitle("Queue ended")
                .setDescription(
                    "Share a quick rating of the overall experience."
                )
                .setFooter({ text: "Tap to rate • 1–5 in under 10s" });

            // Public prompt in the text channel
            const promptMsg = await channel.send({
                embeds: [baseEmbed],
                components: [buildStartRow(sessionId)]
            });

            // Step 1: wait for any user to click "Rate experience"
            const startInteraction = await promptMsg
                .awaitMessageComponent({
                    componentType: ComponentType.Button,
                    filter: i => i.customId === `qexp_start_${sessionId}`,
                    time: 3 * 60 * 1000
                })
                .catch(() => null);

            if (!startInteraction) {
                await promptMsg
                    .edit({
                        embeds: [
                            EmbedBuilder.from(baseEmbed).setFooter({
                                text: "Feedback window expired"
                            })
                        ],
                        components: []
                    })
                    .catch(() => {});
                return;
            }

            const user = startInteraction.user;
            const userId = user.id;

            // Reply ephemerally to that user and keep editing this reply
            await startInteraction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#5865F2")
                        .setTitle("Rate your experience")
                        .setDescription(
                            "How would you rate the overall experience? Select a score from 1 to 5."
                        )
                        .setFooter({ text: "1 = Very poor • 5 = Excellent" })
                ],
                components: [buildRatingMenu(sessionId)],
                ephemeral: true
            }); // ephemeral threading for this user [21][18]

            // Fetch ephemeral reply to await components on the same message
            const ephemeralMsg = await startInteraction
                .fetchReply()
                .catch(() => null);
            if (!ephemeralMsg) return;

            // Step 2: wait for 1–5 select from the same user
            const selectInteraction = await ephemeralMsg
                .awaitMessageComponent({
                    componentType: ComponentType.StringSelect,
                    filter: i =>
                        i.customId === `qexp_select_${sessionId}` &&
                        i.user.id === userId,
                    time: 2 * 60 * 1000
                })
                .catch(() => null);

            if (!selectInteraction) {
                await startInteraction
                    .editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#ED4245")
                                .setTitle("Feedback timed out")
                                .setDescription(
                                    "No rating was received in time."
                                )
                        ],
                        components: []
                    })
                    .catch(() => {});
                return;
            }

            const rating = parseInt(selectInteraction.values, 10);

            await selectInteraction.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#57F287")
                        .setTitle("Thanks for rating!")
                        .setDescription(
                            `Recorded: ${"★".repeat(rating)}${"☆".repeat(
                                5 - rating
                            )} (${rating}/5). Would you like to add a short review?`
                        )
                        .setFooter({ text: "Optional, up to 500 characters." })
                ],
                components: [buildReviewRow(sessionId)]
            });

            // Step 3: ask to add a review; if yes, show modal; else skip
            const reviewChoice = await ephemeralMsg
                .awaitMessageComponent({
                    componentType: ComponentType.Button,
                    filter: i =>
                        (i.customId === `qexp_review_yes_${sessionId}` ||
                            i.customId === `qexp_review_no_${sessionId}`) &&
                        i.user.id === userId,
                    time: 2 * 60 * 1000
                })
                .catch(() => null);

            let reviewText = null;

            if (
                reviewChoice &&
                reviewChoice.customId === `qexp_review_yes_${sessionId}`
            ) {
                const modal = new ModalBuilder()
                    .setCustomId(`qexp_modal_${sessionId}`)
                    .setTitle("Quick review")
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId("review_text")
                                .setLabel("What went well or poorly?")
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(false)
                                .setMaxLength(500)
                        )
                    );

                await reviewChoice.showModal(modal).catch(() => {});

                // Wait for modal submit from same user
                const modalSubmit = await reviewChoice
                    .awaitModalSubmit({
                        time: 120_000,
                        filter: m =>
                            m.customId === `qexp_modal_${sessionId}` &&
                            m.user.id === userId
                    })
                    .catch(() => null);

                if (modalSubmit) {
                    reviewText =
                        modalSubmit.fields
                            .getTextInputValue("review_text")
                            ?.trim() || null;
                    await modalSubmit
                        .reply({
                            content: "Thanks for the detailed review!",
                            ephemeral: true
                        })
                        .catch(() => {});
                } else {
                    await reviewChoice
                        .followUp({
                            content:
                                "Review window expired, saved your rating only.",
                            ephemeral: true
                        })
                        .catch(() => {});
                }
            } else if (reviewChoice) {
                await reviewChoice.deferUpdate().catch(() => {});
            }

            // Final ephemeral thank-you with nicer aesthetics
            await startInteraction
                .editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("#5865F2")
                            .setTitle("Thank you for reviewing 💜")
                            .setDescription(
                                [
                                    `Rating: ${"★".repeat(rating)}${"☆".repeat(
                                        5 - rating
                                    )} (${rating}/5)`,
                                    reviewText
                                        ? "Review received. We appreciate the details!"
                                        : "No review provided this time.",
                                    "Your feedback helps improve the queue experience."
                                ].join("\n")
                            )
                            .setFooter({ text: "Melody • Feedback recorded" })
                    ],
                    components: []
                })
                .catch(() => {});

            // Optionally update the public prompt to show availability (or clear components)
            /* await promptMsg.edit({
        embeds: [EmbedBuilder.from(promptMsg.embeds).setFooter({ text: "Feedback active (others can rate too)" })],
    
        components: [buildStartRow(sessionId)]
      }).catch(() => {});
*/
            // Structured logging with user + guild + channel
            const logChannel = client.channels.cache.get(
                FEEDBACK_LOG_CHANNEL_ID
            );
            if (logChannel && logChannel.send) {
                await logChannel
                    .send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#5865F2")
                                .setTitle("🎧 Queue End Feedback")
                                .addFields(
                                    {
                                        name: "User",
                                        value: `${user.tag} (<@${user.id}>) [${user.id}]`,
                                        inline: true
                                    },
                                    {
                                        name: "Username",
                                        value: user.username ?? "unknown",
                                        inline: true
                                    },
                                    {
                                        name: "Guild",
                                        value: player.guildId,
                                        inline: true
                                    },
                                    {
                                        name: "Text Channel",
                                        value:
                                            player.textChannelId ?? "unknown",
                                        inline: true
                                    },
                                    {
                                        name: "Session",
                                        value: sessionId,
                                        inline: true
                                    },
                                    {
                                        name: "Rating",
                                        value: `${rating}/5`,
                                        inline: true
                                    },
                                    {
                                        name: "Review",
                                        value: reviewText || "No review",
                                        inline: false
                                    }
                                )
                                .setTimestamp?.()
                        ]
                    })
                    .catch(() => {});
            }

            // Optional persistence:
            // await QueueCSATModel.create({
            //   guildId: player.guildId,
            //   userId: user.id,
            //   channelId: player.textChannelId,
            //   sessionId,
            //   rating,
            //   review: reviewText,
            //   ts: Date.now()
            // });
        } catch (e) {
            console.error(e);
        }
    }
};
