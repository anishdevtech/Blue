module.exports = {
    disableAllButtons,

    disableAllButtonsFromMsg
};
const { ActionRowBuilder } = require("discord.js");

async function disableAllButtons(interaction) {
    if (!interaction.isButton()) return; // Only handle button interactions

    const updatedComponents = interaction.message.components.map(row => {
        row.components.forEach(button => {
            button.data.disabled = true;
        });
        return new ActionRowBuilder().addComponents(row.components);
    });

    await interaction.message.edit({ components: updatedComponents });
}

  const { ButtonBuilder } = require("discord.js");

async function disableAllButtonsFromMsg(message, exceptionIds = []) {
    const updatedComponents = message.components.map(row => {
        const newRow = new ActionRowBuilder();
        row.components.forEach(comp => {
            if (comp.type === 2) {
                // Button
                // If this button's customId is in the exceptions, keep enabled
                if (exceptionIds.includes(comp.customId)) {
                    newRow.addComponents(
                        ButtonBuilder.from(comp).setDisabled(false)
                    );
                } else {
                    newRow.addComponents(
                        ButtonBuilder.from(comp).setDisabled(true)
                    );
                }
            } else {
                newRow.addComponents(comp); // Non-buttons remain unchanged
            }
        });
        return newRow;
    });

    await message.edit({ components: updatedComponents });
}
