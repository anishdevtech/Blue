const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} = require('discord.js');
const VerificationConfig = require('../../../schemas/VerificationConfig');
const ExtendedClient = require('../../../class/ExtendedClient');

const VARIABLE_EXAMPLES = `
**Available variables:**
• \`{user.name}\` - The username of the member
• \`{user.tag}\` - The full tag of the member (name#discrim)
• \`{user.id}\` - User ID
• \`{server.name}\` - Server name
• \`{server.id}\` - Server ID
• \`{member.count}\` - Member count of the server

**Example:** "Welcome {user.name} to {server.name}!"
`;

const BUTTON_COLORS = [
  { label: 'Primary (Blue)', value: ButtonStyle.Primary.toString(), description: 'Standard blue button' },
  { label: 'Secondary (Grey)', value: ButtonStyle.Secondary.toString(), description: 'Grey neutral button' },
  { label: 'Success (Green)', value: ButtonStyle.Success.toString(), description: 'Green success button' },
  { label: 'Danger (Red)', value: ButtonStyle.Danger.toString(), description: 'Red attention button' },
];

const RECOMMENDED_TEMPLATES = [
  {
    label: 'Welcome Template',
    description: 'A friendly welcome message with clean layout',
    embed: {
      title: 'Welcome to {server.name}!',
      description: 'Please verify yourself by clicking the button below to gain access to all server channels.',
      color: '#00FF00'
    },
    confirmationMessage: 'Welcome {user.name}! You have been verified successfully and can now access all channels.',
    buttonColor: ButtonStyle.Success.toString(),
    buttonEmoji: '✅',
  },
  {
    label: 'Simple Verify',
    description: 'Minimal and straightforward verification prompt',
    embed: {
      title: 'Verify',
      description: 'Click the button below to verify and gain access to server channels.',
      color: '#0099FF'
    },
    confirmationMessage: 'Thanks for verifying, {user.name}!',
    buttonColor: ButtonStyle.Primary.toString(),
    buttonEmoji: '🛡️',
  },
  {
    label: 'Professional Style',
    description: 'Professional and formal embed layout',
    embed: {
      title: 'Verification Required',
      description: 'To participate in this server, please complete verification by clicking the button below. This helps us maintain a secure community.',
      color: '#FF4500'
    },
    confirmationMessage: 'Hello {user.name}, your verification is complete. Welcome to the server!',
    buttonColor: ButtonStyle.Danger.toString(),
    buttonEmoji: '🔒',
  },
];

const DEFAULT_EMBED_COLOR = '#0099ff';

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('verification')
    .setDescription('Setup a comprehensive verification system for your Discord server'),

  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    // Permission checks
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('❌ Insufficient Permissions')
          .setDescription('You need **Manage Server** or **Administrator** permissions to set up verification.')
          .setColor('#FF0000')
        ],
        ephemeral: true,
      });
    }

    const botMember = await interaction.guild.members.fetchMe();
    if (
      !botMember.permissions.has(PermissionFlagsBits.ManageRoles) ||
      !botMember.permissions.has(PermissionFlagsBits.ManageChannels) ||
      !botMember.permissions.has(PermissionFlagsBits.SendMessages)
    ) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('❌ Bot Missing Permissions')
          .setDescription('I need the following permissions to set up verification:\n• **Manage Roles**\n• **Manage Channels**\n• **Send Messages**')
          .setColor('#FF0000')
        ],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🛠️ Verification Setup Started')
        .setDescription('Let\'s set up your server\'s verification system! Follow the steps below.')
        .setColor(DEFAULT_EMBED_COLOR)
      ],
      ephemeral: true,
    });

    const filter = (i) => i.user.id === interaction.user.id;
    let setupData = {};

    // Helper function for optional prompts with skip
    async function promptWithSkip(embed, confirmId, skipId, timeout = 120000) {
      const confirmBtn = new ButtonBuilder()
        .setCustomId(confirmId)
        .setLabel('Continue')
        .setStyle(ButtonStyle.Success);
      const skipBtn = new ButtonBuilder()
        .setCustomId(skipId)
        .setLabel('Skip')
        .setStyle(ButtonStyle.Secondary);
      const row = new ActionRowBuilder().addComponents(confirmBtn, skipBtn);

      await interaction.editReply({ embeds: [embed], components: [row] });

      try {
        const choice = await interaction.channel.awaitMessageComponent({
          filter,
          time: timeout,
          componentType: ComponentType.Button,
        });
        await choice.deferUpdate();
        return choice.customId === confirmId;
      } catch {
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('⏰ Setup Timed Out')
            .setDescription('The verification setup has been cancelled due to inactivity.')
            .setColor('#FF0000')
          ],
          components: [],
        });
        throw new Error('Timeout');
      }
    }

    // Helper function for collecting user messages
    async function collectUserMessage(promptEmbed, timeout = 300000) {
      await interaction.editReply({ embeds: [promptEmbed], components: [] });

      const msgFilter = (m) => m.author.id === interaction.user.id;
      try {
        const collected = await interaction.channel.awaitMessages({
          filter: msgFilter,
          max: 1,
          time: timeout,
          errors: ['time'],
        });
        const message = collected.first();
        if (message.deletable) await message.delete().catch(() => {}); // Clean up user message
        return message.content;
      } catch {
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('⏰ Input Timed Out')
            .setDescription('You took too long to respond. Setup cancelled.')
            .setColor('#FF0000')
          ],
          components: [],
        });
        throw new Error('Message collection timeout');
      }
    }

    try {
      // Step 1: Ask for recommended templates
      const templateEmbed = new EmbedBuilder()
        .setTitle('📋 Step 1: Recommended Templates')
        .setDescription(
          'Would you like to use a pre-made verification template for quick setup?\n\n' +
          'Templates include:\n' +
          '• **Welcome Template**: Friendly and inviting\n' +
          '• **Simple Verify**: Clean and minimal\n' +
          '• **Professional Style**: Formal and business-like\n\n' +
          'You can customize everything later or skip to create your own from scratch.'
        )
        .setColor(DEFAULT_EMBED_COLOR);

      const useTemplate = await promptWithSkip(templateEmbed, 'template_yes', 'template_skip');
      
      let chosenTemplate = null;
      if (useTemplate) {
        const templateOptions = RECOMMENDED_TEMPLATES.map((t, i) => ({
          label: t.label,
          description: t.description,
          value: i.toString(),
        }));

        const templateSelect = new StringSelectMenuBuilder()
          .setCustomId('select_template')
          .setPlaceholder('Choose a template')
          .addOptions(templateOptions);

        const templateRow = new ActionRowBuilder().addComponents(templateSelect);

        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('📋 Select Template')
            .setDescription('Choose which template you\'d like to use:')
            .setColor(DEFAULT_EMBED_COLOR)
          ],
          components: [templateRow],
        });

        try {
          const templateInt = await interaction.channel.awaitMessageComponent({
            filter,
            componentType: ComponentType.StringSelect,
            time: 120000,
          });
          await templateInt.deferUpdate();
          chosenTemplate = RECOMMENDED_TEMPLATES[parseInt(templateInt.values[0], 10)];
        } catch {
          throw new Error('Template selection timeout');
        }
      }

      // Step 2: Verification Channel (Required)
      const channelEmbed = new EmbedBuilder()
        .setTitle('📍 Step 2: Verification Channel (Required)')
        .setDescription(
          'Select the channel where users will verify themselves.\n\n' +
          '**Important:**\n' +
          '• This channel should be accessible to unverified members\n' +
          '• The verification message will be sent here\n' +
          '• Consider using a dedicated #verification channel'
        )
        .setColor(DEFAULT_EMBED_COLOR);

      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('select_verification_channel')
        .setPlaceholder('Select the verification channel')
        .setMinValues(1)
        .setMaxValues(1)
        .addChannelTypes(0, 5);

      const channelRow = new ActionRowBuilder().addComponents(channelSelect);

      await interaction.editReply({
        embeds: [channelEmbed],
        components: [channelRow],
      });

      let verificationChannel;
      try {
        const chInt = await interaction.channel.awaitMessageComponent({
          filter,
          componentType: ComponentType.ChannelSelect,
          time: 120000,
        });
        verificationChannel = chInt.channels.first();
        await chInt.deferUpdate();
      } catch {
        throw new Error('Channel selection timeout');
      }

      // Step 3: Verification Role (Required)
      const roleEmbed = new EmbedBuilder()
        .setTitle('👤 Step 3: Verification Role (Required)')
        .setDescription(
          'Select the role that will be assigned to users when they verify.\n\n' +
          '**Tips:**\n' +
          '• This role should have access to your server channels\n' +
          '• Make sure the bot\'s role is higher than this role\n' +
          '• You can create a @Verified role specifically for this purpose'
        )
        .setColor(DEFAULT_EMBED_COLOR);

      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('select_verification_role')
        .setPlaceholder('Select the verification role')
        .setMinValues(1)
        .setMaxValues(1);

      const roleRow = new ActionRowBuilder().addComponents(roleSelect);

      await interaction.editReply({
        embeds: [roleEmbed],
        components: [roleRow],
      });

      let verificationRole;
      try {
        const roleInt = await interaction.channel.awaitMessageComponent({
          filter,
          componentType: ComponentType.RoleSelect,
          time: 120000,
        });
        verificationRole = roleInt.roles.first();
        await roleInt.deferUpdate();
      } catch {
        throw new Error('Role selection timeout');
      }

      // Step 4: Verification Method (Required)
      const methodEmbed = new EmbedBuilder()
        .setTitle('🔐 Step 4: Verification Method (Required)')
        .setDescription(
          'Choose how users will verify themselves:\n\n' +
          '🔘 **Button Verification**: Simple one-click verification\n' +
          '• Quick and easy for users\n' +
          '• Good for most servers\n\n' +
          '🧩 **Captcha Verification**: Users solve a captcha puzzle\n' +
          '• More secure against bots\n' +
          '• Slightly more complex for users'
        )
        .setColor(DEFAULT_EMBED_COLOR);

      const methodSelect = new StringSelectMenuBuilder()
        .setCustomId('select_verification_method')
        .setPlaceholder('Choose verification method')
        .addOptions([
          { 
            label: 'Button Verification', 
            value: 'button',
            description: 'Simple one-click verification',
            emoji: '🔘'
          },
          { 
            label: 'Captcha Verification', 
            value: 'captcha',
            description: 'Secure captcha-based verification',
            emoji: '🧩'
          },
        ]);

      const methodRow = new ActionRowBuilder().addComponents(methodSelect);

      await interaction.editReply({
        embeds: [methodEmbed],
        components: [methodRow],
      });

      let verificationMethod;
      try {
        const methodInt = await interaction.channel.awaitMessageComponent({
          filter,
          componentType: ComponentType.StringSelect,
          time: 120000,
        });
        verificationMethod = methodInt.values[0];
        await methodInt.deferUpdate();
      } catch {
        throw new Error('Method selection timeout');
      }

      // Step 5: Embed Customization (Optional)
      let embeds = [];
      let confirmationMessage = 'Congrats {user.name}, you are now verified in {server.name}!';
      let buttonColor = ButtonStyle.Primary.toString();
      let buttonEmoji = '✅';

      if (chosenTemplate) {
        // Use template settings
        embeds = [new EmbedBuilder()
          .setTitle(chosenTemplate.embed.title)
          .setDescription(chosenTemplate.embed.description)
          .setColor(chosenTemplate.embed.color)
          .setTimestamp()
          .setFooter({ text: 'Verification System' })
        ];
        confirmationMessage = chosenTemplate.confirmationMessage;
        buttonColor = chosenTemplate.buttonColor;
        buttonEmoji = chosenTemplate.buttonEmoji;
      } else {
        const customizeEmbed = new EmbedBuilder()
          .setTitle('🎨 Step 5: Embed Customization (Optional)')
          .setDescription(
            'Would you like to customize the verification embed message?\n\n' +
            '**You can customize:**\n' +
            '• Embed title and description\n' +
            '• Colors and styling\n' +
            '• Multiple embeds\n' +
            '• Custom variables\n\n' +
            'If you skip, a default embed will be used.'
          )
          .setColor(DEFAULT_EMBED_COLOR);

        const customizeEmbeds = await promptWithSkip(customizeEmbed, 'customize_yes', 'customize_skip');

        if (customizeEmbeds) {
          // Collect custom embeds
          let addMore = true;
          while (addMore) {
            // Embed Title
            const titlePrompt = new EmbedBuilder()
              .setTitle('📝 Embed Title')
              .setDescription(
                'Send the title for this embed, or type "skip" to leave blank.\n\n' +
                VARIABLE_EXAMPLES
              )
              .setColor(DEFAULT_EMBED_COLOR);

            const embedTitle = await collectUserMessage(titlePrompt);

            // Embed Description
            const descPrompt = new EmbedBuilder()
              .setTitle('📄 Embed Description')
              .setDescription(
                'Send the description for this embed.\n\n' +
                VARIABLE_EXAMPLES
              )
              .setColor(DEFAULT_EMBED_COLOR);

            const embedDescription = await collectUserMessage(descPrompt);

            // Embed Color
            const colorPrompt = new EmbedBuilder()
              .setTitle('🎨 Embed Color')
              .setDescription(
                'Send the embed color in HEX format (e.g. #0099ff) or type "default".\n\n' +
                '**Examples:**\n' +
                '• #FF0000 (Red)\n' +
                '• #00FF00 (Green)\n' +
                '• #0099FF (Blue)\n' +
                '• default (Uses #0099ff)'
              )
              .setColor(DEFAULT_EMBED_COLOR);

            let embedColor = await collectUserMessage(colorPrompt);
            embedColor = /^#([0-9A-F]{3}){1,2}$/i.test(embedColor) ? embedColor : 
                        embedColor.toLowerCase() === 'default' ? DEFAULT_EMBED_COLOR : DEFAULT_EMBED_COLOR;

            // Create embed
            const embed = new EmbedBuilder()
              .setTitle(embedTitle.toLowerCase() === 'skip' ? '' : embedTitle)
              .setDescription(embedDescription)
              .setColor(embedColor)
              .setTimestamp()
              .setFooter({ text: 'Verification System' });

            embeds.push(embed);

            // Ask to add more embeds
            const addMoreEmbed = new EmbedBuilder()
              .setTitle('➕ Add More Embeds?')
              .setDescription(
                `You have created ${embeds.length} embed(s).\n\n` +
                'Would you like to add another embed or finish?'
              )
              .setColor(DEFAULT_EMBED_COLOR);

            const addMoreYes = new ButtonBuilder()
              .setCustomId('add_more_yes')
              .setLabel('Add Another')
              .setStyle(ButtonStyle.Primary);

            const addMoreNo = new ButtonBuilder()
              .setCustomId('add_more_no')
              .setLabel('Finish')
              .setStyle(ButtonStyle.Success);

            const addMoreRow = new ActionRowBuilder().addComponents(addMoreYes, addMoreNo);

            await interaction.editReply({
              embeds: [addMoreEmbed],
              components: [addMoreRow],
            });

            try {
              const addMoreInt = await interaction.channel.awaitMessageComponent({
                filter,
                componentType: ComponentType.Button,
                time: 120000,
              });
              await addMoreInt.deferUpdate();
              addMore = addMoreInt.customId === 'add_more_yes';
            } catch {
              addMore = false;
            }
          }

          // Preview all embeds and ask to continue or edit
          const previewEmbed = new EmbedBuilder()
            .setTitle('👀 Embed Preview')
            .setDescription(
              `Preview of your ${embeds.length} verification embed(s).\n\n` +
              'Would you like to continue with these embeds or edit them?'
            )
            .setColor(DEFAULT_EMBED_COLOR);

          const continueBtn = new ButtonBuilder()
            .setCustomId('continue_embeds')
            .setLabel('Continue')
            .setStyle(ButtonStyle.Success);

          const editBtn = new ButtonBuilder()
            .setCustomId('edit_embeds')
            .setLabel('Edit')
            .setStyle(ButtonStyle.Secondary);

          const previewRow = new ActionRowBuilder().addComponents(continueBtn, editBtn);

          await interaction.editReply({
            embeds: [...embeds, previewEmbed],
            components: [previewRow],
          });

          try {
            const previewInt = await interaction.channel.awaitMessageComponent({
              filter,
              componentType: ComponentType.Button,
              time: 180000,
            });

            if (previewInt.customId === 'edit_embeds') {
              await previewInt.deferUpdate();
              // Restart embed collection (simplified - could be more sophisticated)
              embeds = [];
              // You could implement a more complex edit system here
              await interaction.editReply({
                embeds: [new EmbedBuilder()
                  .setTitle('🔄 Embed Editing')
                  .setDescription('Please restart the setup to edit embeds.')
                  .setColor(DEFAULT_EMBED_COLOR)
                ],
                components: []
              });
              return;
            }
            await previewInt.deferUpdate();
          } catch {
            throw new Error('Preview timeout');
          }
        } else {
          // Use default embed
          embeds = [new EmbedBuilder()
            .setTitle('Verify Yourself!')
            .setDescription('Click the button below to verify and gain access to the server.')
            .setColor(DEFAULT_EMBED_COLOR)
            .setTimestamp()
            .setFooter({ text: 'Verification System' })
          ];
        }
      }

      // Step 6: Confirmation Message (Optional if not using template)
      if (!chosenTemplate) {
        const confirmMsgEmbed = new EmbedBuilder()
          .setTitle('💬 Step 6: Confirmation Message (Optional)')
          .setDescription(
            'Customize the message sent to users after successful verification.\n\n' +
            '**Default message:**\n' +
            '`Congrats {user.name}, you are now verified in {server.name}!`\n\n' +
            VARIABLE_EXAMPLES
          )
          .setColor(DEFAULT_EMBED_COLOR);

        const customizeConfirm = await promptWithSkip(confirmMsgEmbed, 'confirm_yes', 'confirm_skip');

        if (customizeConfirm) {
          const msgPrompt = new EmbedBuilder()
            .setTitle('💬 Confirmation Message')
            .setDescription(
              'Send your custom confirmation message.\n\n' +
              VARIABLE_EXAMPLES
            )
            .setColor(DEFAULT_EMBED_COLOR);

          confirmationMessage = await collectUserMessage(msgPrompt);
        }
      }

      // Step 7: Button Customization (Optional)
      if (!chosenTemplate) {
        const buttonCustomEmbed = new EmbedBuilder()
          .setTitle('🔘 Step 7: Button Customization (Optional)')
          .setDescription(
            'Customize the verification button appearance.\n\n' +
            'You can set:\n' +
            '• Button color (Primary, Success, Danger, Secondary)\n' +
            '• Button emoji\n\n' +
            'Default: Primary blue button with ✅ emoji'
          )
          .setColor(DEFAULT_EMBED_COLOR);

        const customizeButton = await promptWithSkip(buttonCustomEmbed, 'button_yes', 'button_skip');

        if (customizeButton) {
          // Button Color
          const colorOptions = BUTTON_COLORS.map(color => ({
            label: color.label,
            description: color.description,
            value: color.value,
          }));

          const buttonColorSelect = new StringSelectMenuBuilder()
            .setCustomId('select_button_color')
            .setPlaceholder('Choose button color')
            .addOptions(colorOptions);

          const colorRow = new ActionRowBuilder().addComponents(buttonColorSelect);

          await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('🎨 Button Color')
              .setDescription('Select the color for the verification button:')
              .setColor(DEFAULT_EMBED_COLOR)
            ],
            components: [colorRow],
          });

          try {
            const colorInt = await interaction.channel.awaitMessageComponent({
              filter,
              componentType: ComponentType.StringSelect,
              time: 120000,
            });
            buttonColor = colorInt.values[0];
            await colorInt.deferUpdate();
          } catch {
            // Keep default
          }

          // Button Emoji
          const emojiPrompt = new EmbedBuilder()
            .setTitle('😀 Button Emoji')
            .setDescription(
              'Send an emoji for the verification button, or type "none" for no emoji.\n\n' +
              '**Examples:**\n' +
              '• ✅ (checkmark)\n' +
              '• 🛡️ (shield)\n' +
              '• 🔒 (lock)\n' 
              
            )
            .setColor(DEFAULT_EMBED_COLOR);

          const emojiInput = await collectUserMessage(emojiPrompt);
          buttonEmoji = emojiInput.toLowerCase() === 'none' ? '' : emojiInput;
        }
      }

      // Step 8: Log Channel (Optional)
      const logEmbed = new EmbedBuilder()
        .setTitle('📊 Step 8: Log Channel (Optional)')
        .setDescription(
          'Select a channel for verification logs.\n\n' +
          '**Logs will include:**\n' +
          '• Successful verifications\n' +
          '• Failed verification attempts\n' +
          '• System events\n\n' +
          'This helps you monitor verification activity and troubleshoot issues.'
        )
        .setColor(DEFAULT_EMBED_COLOR);

      const wantsLog = await promptWithSkip(logEmbed, 'log_yes', 'log_skip');
      
      let logChannel = null;
      if (wantsLog) {
        const logChannelSelect = new ChannelSelectMenuBuilder()
          .setCustomId('select_log_channel')
          .setPlaceholder('Select log channel')
          .setMinValues(1)
          .setMaxValues(1)
          .addChannelTypes(0, 5);

        const logRow = new ActionRowBuilder().addComponents(logChannelSelect);

        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('📊 Select Log Channel')
            .setDescription('Choose the channel for verification logs:')
            .setColor(DEFAULT_EMBED_COLOR)
          ],
          components: [logRow],
        });

        try {
          const logInt = await interaction.channel.awaitMessageComponent({
            filter,
            componentType: ComponentType.ChannelSelect,
            time: 120000,
          });
          logChannel = logInt.channels.first();
          await logInt.deferUpdate();
        } catch {
          // No log channel selected
        }
      }

      // Save configuration to database
      const configData = {
        guildId: interaction.guild.id,
        verificationChannelId: verificationChannel.id,
        verificationRoleId: verificationRole.id,
        verificationMethod,
        embeds: embeds.map(e => ({
          title: e.data.title || '',
          description: e.data.description || '',
          color: e.hexColor || DEFAULT_EMBED_COLOR,
          fields: e.data.fields || [],
          footer: {
            text: e.data.footer?.text || '',
            icon_url: e.data.footer?.iconURL || '',
          },
          timestamp: !!e.data.timestamp,
        })),
        confirmationMessage,
        buttonColor,
        buttonEmoji,
        logChannelId: logChannel ? logChannel.id : null,
        active: true,
        updatedAt: new Date(),
      };

      await VerificationConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        configData,
        { upsert: true }
      );

      // Final success message
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Verification Setup Complete!')
        .setDescription(
          'Your verification system has been successfully configured!\n\n' +
          `**Configuration Summary:**\n` +
          `• **Channel:** <#${verificationChannel.id}>\n` +
          `• **Role:** <@&${verificationRole.id}>\n` +
          `• **Method:** ${verificationMethod === 'button' ? 'Button Click' : 'Captcha'}\n` +
          `• **Embeds:** ${embeds.length} embed(s)\n` +
          `• **Log Channel:** ${logChannel ? `<#${logChannel.id}>` : 'None'}\n\n` +
          'The verification system is now active!'
        )
        .setColor('#00FF00')
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed], // Show first 3 embeds in preview
        components: [],
      });

    } catch (error) {
      console.error('Verification setup error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Setup Failed')
        .setDescription(
          error.message.includes('timeout') || error.message.includes('Timeout') 
            ? 'Setup was cancelled due to inactivity.' 
            : 'An error occurred during setup. Please try again.'
        )
        .setColor('#FF0000');

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.editReply({ embeds: [errorEmbed], components: [] });
      }
    }
  },
};
