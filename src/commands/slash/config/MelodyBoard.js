// ========================= Imports =========================
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ComponentType,
} = require("discord.js");
const MelodyBoard = require("../../../schemas/MelodyBoard"); // adjust path
const sendMelodyBoardPanel = require("../../../Functions/MelodyBoardFunction.js"); // adjust path

// ===================== Command Structure =====================
module.exports = {
  structure: new SlashCommandBuilder()
    .setName("melodyboard")
    .setDescription("Setup your server's MelodyBoard (music system).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ====================== Command Run Logic ======================
  run: async (client, interaction) => {
    // Shared session state
    const state = {
      step: "choose_mode", // choose_mode -> choose_text -> choose_voice -> done
      selectedTextId: null,
    };

    // Helper builders
    const info = (t, d) => new EmbedBuilder().setTitle(t).setDescription(d).setColor("Blue");
    const ok = (t, d) => new EmbedBuilder().setTitle(t).setDescription(d).setColor("Green");
    const err = (t, d) => new EmbedBuilder().setTitle(t).setDescription(d).setColor("Red");

    // Initial prompt (ephemeral) with buttons
    const promptEmbed = info(
      "MelodyBoard Setup",
      "Select how to set up:\n\n• Automatic: create category + text + voice\n• Custom: pick existing channels (text should be empty/nearly empty)"
    );

    const modeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("mode_auto").setLabel("Automatic").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("mode_manual").setLabel("Custom").setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({
      embeds: [promptEmbed],
      components: [modeRow],
      flags: 64, // ephemeral
    });

    const prompt = await interaction.fetchReply();

    // Utility: edit prompt quickly and safely
    const setPrompt = async (embed, components = []) => {
      try {
        await interaction.editReply({ embeds: [embed], components });
      } catch {}
    };

    // Step 1: choose mode (buttons)
    const modeCollector = prompt.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: i => i.user.id === interaction.user.id && i.message.id === prompt.id,
      time: 2 * 60 * 1000,
    });

    modeCollector.on("collect", async i => {
      await i.deferUpdate().catch(() => {});

      if (state.step !== "choose_mode") return; // ignore if already advanced

      const guild = interaction.guild;

      if (i.customId === "mode_auto") {
        state.step = "working";
        await setPrompt(info("Working…", "Creating category and channels…"));

        try {
          const category = await guild.channels.create({
            name: "MelodyBoard",
            type: ChannelType.GuildCategory,
          });
          const text = await guild.channels.create({
            name: "music-requests",
            type: ChannelType.GuildText,
            parent: category.id,
          });
          const voice = await guild.channels.create({
            name: "Music Room",
            type: ChannelType.GuildVoice,
            parent: category.id,
          });

          await MelodyBoard.findOneAndUpdate(
            { guildId: guild.id },
            { channelId: text.id, voiceId: voice.id },
            { upsert: true, new: true }
          );

          await sendMelodyBoardPanel(guild, text, client, true).catch(() => {});

          state.step = "done";
          await setPrompt(ok(
            "Setup Complete",
            `✅ Finished.\n\nText: ${text}\nVoice: ${voice}\n\nYou may move/rename channels freely.`
          ));
          modeCollector.stop("done");
          return;
        } catch {
          state.step = "done";
          await setPrompt(err("Setup Failed", "❌ Could not create channels. Check Manage Channels permission."));
          modeCollector.stop("error");
          return;
        }
      }

      if (i.customId === "mode_manual") {
        // Build text channel options
        const textOptions = interaction.guild.channels.cache
          .filter(c => c.type === ChannelType.GuildText)
          .map(c => ({ label: c.name, value: c.id, description: `#${c.name}` }))
          .slice(0, 25);

        const voiceExists = interaction.guild.channels.cache.some(c => c.type === ChannelType.GuildVoice);

        if (!textOptions.length || !voiceExists) {
          state.step = "done";
          await setPrompt(err("Setup Blocked", "❌ Need at least one text and one voice channel."));
          modeCollector.stop("nochannels");
          return;
        }

        state.step = "choose_text";

        const pickText = info(
          "Pick Text Channel",
          "Select a text channel to host MelodyBoard requests.\nIt should be empty or nearly empty; messages will be cleared."
        );
        const textRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("pick_text")
            .setPlaceholder("Select Text Channel…")
            .addOptions(textOptions),
        );

        await setPrompt(pickText, [textRow]);
        modeCollector.stop("next");
      }
    });

    modeCollector.on("end", async (_, reason) => {
      if (reason === "time" && state.step === "choose_mode") {
        await setPrompt(err("Timed Out", "❌ No selection received. Run /melodyboard again."));
      }
      // If "next", the next collector will start below.
    });

    // Step 2: choose text channel (select)
    const textCollector = prompt.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: i => i.user.id === interaction.user.id && i.customId === "pick_text" && i.message.id === prompt.id,
      time: 2 * 60 * 1000,
    });

    textCollector.on("collect", async i => {
      await i.deferUpdate().catch(() => {});
      if (state.step !== "choose_text") return;

      const guild = interaction.guild;
      const chosenId = i.values;
      const textChannel = guild.channels.cache.get(chosenId);

      if (!textChannel || textChannel.type !== ChannelType.GuildText) {
        await setPrompt(err("Invalid Channel", "❌ That is not a valid text channel. Try again."));
        return;
      }

      // Check messages
      const msgs = await textChannel.messages.fetch({ limit: 100 }).catch(() => null);
      if (!msgs) {
        await setPrompt(err("Permission Error", "❌ Could not fetch messages. Check permissions."));
        return;
      }
      if (msgs.size > 50) {
        await setPrompt(err("Channel Not Empty", "❌ Selected channel has more than 50 messages. Pick a emptier one."));
        return;
      }

      await textChannel.bulkDelete(msgs, true).catch(() => {});
      state.selectedTextId = textChannel.id;

      // Move to voice selection
      state.step = "choose_voice";

      const voiceOptions = guild.channels.cache
        .filter(c => c.type === ChannelType.GuildVoice)
        .map(c => ({ label: c.name, value: c.id, description: `🔊 ${c.name}` }))
        .slice(0, 25);

      const pickVoice = info("Pick Voice Channel", "✅ Text cleaned. Now select a voice channel.");
      const voiceRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("pick_voice")
          .setPlaceholder("Select Voice Channel…")
          .addOptions(voiceOptions),
      );

      await setPrompt(pickVoice, [voiceRow]);
      textCollector.stop("next");
    });

    textCollector.on("end", async (_, reason) => {
      if (reason === "time" && state.step === "choose_text") {
        await setPrompt(err("Timed Out", "❌ No text channel chosen in time. Run /melodyboard again."));
      }
    });

    // Step 3: choose voice channel (select)
    const voiceCollector = prompt.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: i => i.user.id === interaction.user.id && i.customId === "pick_voice" && i.message.id === prompt.id,
      time: 2 * 60 * 1000,
    });

    voiceCollector.on("collect", async i => {
      await i.deferUpdate().catch(() => {});
      if (state.step !== "choose_voice") return;

      const guild = interaction.guild;
      const voiceId = i.values;
      const voiceChannel = guild.channels.cache.get(voiceId);

      if (!state.selectedTextId || !voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        await setPrompt(err("Invalid Selection", "❌ Invalid voice channel or missing text selection."));
        return;
      }

      await MelodyBoard.findOneAndUpdate(
        { guildId: guild.id },
        { channelId: state.selectedTextId, voiceId: voiceChannel.id },
        { upsert: true, new: true }
      );

      const textChan = guild.channels.cache.get(state.selectedTextId);
      await sendMelodyBoardPanel(guild, textChan, client, true).catch(() => {});

      state.step = "done";
      await setPrompt(
        ok("Setup Complete", `✅ MelodyBoard configured.\n\nText: <#${state.selectedTextId}>\nVoice: <#${voiceChannel.id}>`),
        []
      );
      voiceCollector.stop("done");
    });

    voiceCollector.on("end", async (_, reason) => {
      if (reason === "time" && state.step === "choose_voice") {
        await setPrompt(err("Timed Out", "❌ No voice channel chosen in time. Run /melodyboard again."));
      }
    });
  },
};
