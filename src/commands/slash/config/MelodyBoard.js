const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    StringSelectMenuBuilder
} = require("discord.js");
const MelodyBoard = require("../../../schemas/MelodyBoard"); // Adjust path as needed
const sendMelodyBoardPanel = require("../../../Functions/MelodyBoardFunction.js");
module.exports = {
    structure: new SlashCommandBuilder()
        .setName("melodyboard")
        .setDescription("Setup your server's MelodyBoard (music system).")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async (client, interaction) => {
        await interaction.reply({
            content:
                "**Welcome to MelodyBoard setup!**\nChoose:\n- `Automatic default` to have me create a new category with a text and voice channel for you\n- `Custom` to pick existing channels (must be empty or nearly-empty text channel!)",
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("melodyboard_auto")
                        .setLabel("Automatic Default")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("melodyboard_manual")
                        .setLabel("Custom Setup")
                        .setStyle(ButtonStyle.Primary)
                )
            ],
            ephemeral: true
        });

        // Create a collector for this interaction response
        const msg = await interaction.fetchReply();
        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 2 * 60 * 1000
        });

        collector.on("collect", async btn => {
            const guild = interaction.guild;

            // --- AUTOMATIC DEFAULT OPTION ---
            if (btn.customId === "melodyboard_auto") {
                try {
                    const category = await guild.channels.create({
                        name: "MelodyBoard",
                        type: ChannelType.GuildCategory
                    });
                    const text = await guild.channels.create({
                        name: "music-requests",
                        type: ChannelType.GuildText,
                        parent: category.id
                    });
                    const voice = await guild.channels.create({
                        name: "Music Room",
                        type: ChannelType.GuildVoice,
                        parent: category.id
                    });

                    await MelodyBoard.findOneAndUpdate(
                        { guildId: guild.id },
                        { channelId: text.id, voiceId: voice.id },
                        { upsert: true, new: true }
                    );

                    await btn.update({
                        content:
                            `✅ **MelodyBoard has been set up!**\n` +
                            `**Text:** ${text}\n**Voice:** ${voice}\n` +
                            "All music requests go in the MelodyBoard text channel.\n\n" +
                            "You can move/rename channels as you wish after setup.",
                        components: []
                    });
                } catch (e) {
                    await btn.update({
                        content:
                            "❌ Failed to create channels. Do I have Manage Channels permission?",
                        components: []
                    });
                }
                collector.stop();
                return;
            }

            // --- MANUAL OPTION ---
            if (btn.customId === "melodyboard_manual") {
                const textChannels = guild.channels.cache
                    .filter(c => c.type === ChannelType.GuildText)
                    .map(c => ({
                        label: c.name,
                        value: c.id,
                        description: `#${c.name}`
                    }))
                    .slice(0, 25); // Discord limit for select menu
                const voiceChannels = guild.channels.cache
                    .filter(c => c.type === ChannelType.GuildVoice)
                    .map(c => ({
                        label: c.name,
                        value: c.id,
                        description: `🔊 ${c.name}`
                    }))
                    .slice(0, 25);

                if (!textChannels.length || !voiceChannels.length) {
                    await btn.update({
                        content:
                            "❌ I need at least one text and one voice channel to continue.",
                        components: []
                    });
                    collector.stop();
                    return;
                }

                await btn.update({
                    content:
                        "Please select a **text channel** for MelodyBoard.\n⚠️ It must be empty or nearly empty, as all messages will be deleted.",
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("melody_text")
                                .setPlaceholder("Select Text Channel…")
                                .addOptions(textChannels)
                        )
                    ]
                });
            }

            // --- TEXT CHANNEL SELECT ---
            if (btn.customId === "melody_text") {
                const textChannel = interaction.guild.channels.cache.get(
                    btn.values[0]
                );
                if (
                    !textChannel ||
                    textChannel.type !== ChannelType.GuildText
                ) {
                    await btn.update({
                        content: "❌ Invalid channel. Try again.",
                        components: []
                    });
                    collector.stop();
                    return;
                }
                const msgs = await textChannel.messages.fetch({ limit: 100 });
                if (msgs.size > 50) {
                    await btn.update({
                        content:
                            "❌ Selected channel has **more than 50 messages**. Please pick an empty/nearly empty channel, or create a new one.",
                        components: []
                    });
                    collector.stop();
                    return;
                }
                // Bulk delete (Discord can delete ≤50 at once), then continue
                await textChannel.bulkDelete(msgs, true).catch(() => {});
                await btn.update({
                    content:
                        "✅ Text channel is now clean. Please select a **voice channel**.",
                    components: [
                        new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("melody_voice")
                                .setPlaceholder("Select Voice Channel…")
                                .addOptions(
                                    interaction.guild.channels.cache
                                        .filter(
                                            c =>
                                                c.type ===
                                                ChannelType.GuildVoice
                                        )
                                        .map(c => ({
                                            label: c.name,
                                            value: c.id,
                                            description: `🔊 ${c.name}`
                                        }))
                                        .slice(0, 25)
                                )
                        )
                    ]
                });
                // Store the selected text channel temporarily in the collector
                collector.selectedText = textChannel.id;
            }

            // --- VOICE CHANNEL SELECT ---
            if (btn.customId === "melody_voice") {
                const selectedText = collector.selectedText;
                const voiceChannel = interaction.guild.channels.cache.get(
                    btn.values[0]
                );
                if (
                    !voiceChannel ||
                    voiceChannel.type !== ChannelType.GuildVoice ||
                    !selectedText
                ) {
                    await btn.update({
                        content: "❌ Invalid selection.",
                        components: []
                    });
                    collector.stop();
                    return;
                }
                await MelodyBoard.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { channelId: selectedText, voiceId: voiceChannel.id },
                    { upsert: true, new: true }
                );
                await sendMelodyBoardPanel(
                    interaction.guild,
                    interaction.guild.channels.cache.get(selectedText),
                    client,
                     true
                );

                await btn.update({
                    content: `✅ **MelodyBoard Set Up!**\nText: <#${selectedText}>\nVoice: <#${voiceChannel.id}>`,
                    components: []
                });
                collector.stop();
            }
        });

        collector.on("end", () => {
            // Optionally, perform any cleanup if timed out or finished
        });
    }
};
