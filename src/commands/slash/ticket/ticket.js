const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ComponentType,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Setup the server’s ticket system with panels and admin roles.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    // Ensure only members with Manage Guild can run this
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: "Insufficient permission: Requires Manage Server.",
        ephemeral: true,
      });
    } // [13][12]

    const embed1 = new EmbedBuilder()
      .setTitle("Ticket Setup")
      .setDescription("Configure the ticket system for this server with the options below.") // [12]
      .addFields(
        {
          name: "Options",
          value: [
            "• Manage Panels — create, edit, or delete ticket panels.",
            "• Add Admin Role — designate roles allowed to manage tickets.",
          ].join("\n"),
        } // [9][12]
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("manage_panels")
        .setLabel("Manage Panels")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("add_admin_role")
        .setLabel("Add Admin Role")
        .setStyle(ButtonStyle.Secondary)
    ); // [12][3]

    // Reply and capture the message to scope collectors
    const response = await interaction.reply({
      embeds: [embed1],
      components: [row],
      withResponse: true,
      ephemeral: false, // Setup menu is intended for channel; follow-ups may be ephemeral
    }); // [3][10]

    const setupMsg = response.resource?.message ?? (await interaction.fetchReply()); // [3]

    // Main buttons collector (scoped to this message)
    const mainFilter = (i) =>
      i.message.id === setupMsg.id &&
      i.user.id === interaction.user.id &&
      (i.customId === "manage_panels" || i.customId === "add_admin_role"); // [3][14]

    const mainCollector = setupMsg.createMessageComponentCollector({
      filter: mainFilter,
      componentType: ComponentType.Button,
      time: 60_000,
    }); // [3][5]

    mainCollector.on("collect", async (i) => {
      if (i.customId === "manage_panels") {
        // Panels menu
        const embed2 = new EmbedBuilder()
          .setTitle("Manage Panels")
          .setDescription("Choose an action to manage ticket panels.") // [12]
          .addFields({
            name: "Actions",
            value: [
              "• Add Panel — create a new panel with category, button, and rules.",
              "• Delete Panel — remove an existing panel and its posting.",
              "• Edit Panel — update an existing panel’s metadata.",
            ].join("\n"),
          }); // [9][12]

        const row2 = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("panel_select")
            .setPlaceholder("Select an action…")
            .addOptions([
              {
                label: "Add Panel",
                description: "Create a new ticket panel.",
                value: "add_panel",
              },
              {
                label: "Delete Panel",
                description: "Delete an existing ticket panel.",
                value: "delete_panel",
              },
              {
                label: "Edit Panel",
                description: "Edit an existing ticket panel.",
                value: "edit_panel",
              },
            ])
        ); // [12][9]

        await i.update({ embeds: [embed2], components: [row2] }); // [3]

        // Define a proper filter for the select menu
        const panelFilter = (pi) =>
          pi.message.id === setupMsg.id &&
          pi.user.id === interaction.user.id &&
          pi.customId === "panel_select"; // [3][14]

        const panelCollector = setupMsg.createMessageComponentCollector({
          filter: panelFilter,
          componentType: ComponentType.StringSelect,
          time: 60_000,
        }); // [3][5]

        panelCollector.on("collect", async (panelInteraction) => {
          const selection = panelInteraction.values;
          switch (selection) {
            case "add_panel": {
              // TODO: Prompt for channel/category, button label, emoji, transcript, etc.
              // Implement modal or step-by-step flow here.
              await panelInteraction.update({
                content: "Panel created successfully. Configure details in the next steps.",
                components: [],
                embeds: [],
              }); // [3]
              break;
            }
            case "delete_panel": {
              // TODO: Load panels list and ask which to delete, confirm, then remove
              await panelInteraction.update({
                content: "Panel deleted.",
                components: [],
                embeds: [],
              }); // [3]
              break;
            }
            case "edit_panel": {
              // TODO: Load panel, present editable fields via select or modal
              await panelInteraction.update({
                content: "Panel updated.",
                components: [],
                embeds: [],
              }); // [3]
              break;
            }
            default: {
              await panelInteraction.reply({
                content: "Unknown selection.",
                ephemeral: true,
              }); // [10][7]
            }
          }
          panelCollector.stop("handled");
        });

        panelCollector.on("end", async (collected, reason) => {
          if (reason !== "handled") {
            // Timeout or no action
            try {
              await interaction.followUp({
                content: "No panel action selected within 60 seconds.",
                ephemeral: true,
              }); // [10][7]
            } catch {}
          }
        });
      } else if (i.customId === "add_admin_role") {
        // Role selection flow
        const roleEmbed = new EmbedBuilder()
          .setTitle("Add Admin Role")
          .setDescription("Select one or more roles that can manage tickets.") // [12]
          .addFields({
            name: "Tip",
            value: "Use a dedicated role like “Ticket Admins” for clear access control.",
          }); // [12]

        const roleRow = new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId("admin_role_select")
            .setPlaceholder("Select admin roles")
            .setMinValues(1)
            .setMaxValues(5)
        ); // [9]

        await i.update({ embeds: [roleEmbed], components: [roleRow] }); // [3]

        const roleFilter = (ri) =>
          ri.message.id === setupMsg.id &&
          ri.user.id === interaction.user.id &&
          ri.customId === "admin_role_select"; // [3][14]

        const roleCollector = setupMsg.createMessageComponentCollector({
          filter: roleFilter,
          componentType: ComponentType.RoleSelect,
          time: 60_000,
        }); // [3][5]

        roleCollector.on("collect", async (ri) => {
          const roleIds = ri.values ?? [];
          // TODO: Persist roleIds to your DB/config
          await ri.update({
            content: `Admin roles saved (${roleIds.length}).`,
            components: [],
            embeds: [],
          }); // [3]
          roleCollector.stop("handled");
        });

        roleCollector.on("end", async (collected, reason) => {
          if (reason !== "handled") {
            try {
              await interaction.followUp({
                content: "No roles selected within 60 seconds.",
                ephemeral: true,
              }); // [10][7]
            } catch {}
          }
        });
      }
    });

    mainCollector.on("end", async (collected) => {
      if (collected.size === 0) {
        try {
          await interaction.followUp({
            content: "No interaction received. Please run /ticket again.",
            ephemeral: true,
          }); // [10][7]
        } catch {}
      }
      // Optionally disable components on timeout:
      // await setupMsg.edit({ components: [] });
    });
  },
};
