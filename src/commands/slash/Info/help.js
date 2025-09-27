/** @format */
const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MessageFlags
} = require("discord.js");

// Visual symbols
const BRANCH = "<:branch:1412679179664752732>"; // custom branch emoji

// Category emoji map (custom)
const CATEGORY_EMOJI = {
    utility: "<:utility:1412336482743619584>",
    developers: "<:slash:1412336535440855071>",
    info: "<:general:1412336529417699380>",
    mod: "<:moderation:1412336499285823538>",
    music: "<:music:1412336493678166068>",
    ticket: "<:ticket:1412336599261249618>"
};

// Safe chunk
function chunk(arr, size) {
    const a = Array.isArray(arr) ? arr : [];
    const out = [];
    for (let i = 0; i < a.length; i += size) out.push(a.slice(i, i + size));
    return out;
}

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show bot commands and categories"),

    options: { cooldown: 15_000 },

    /**
     * @param {import("../../../class/ExtendedClient")} client
     * @param {import("discord.js").ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        // Build categories and subcommands from client.applicationcommandsArray
        const raw = Array.isArray(client?.applicationcommandsArray)
            ? client.applicationcommandsArray
            : []; // [12]
        const categories = {};
        for (const entry of raw) {
            const cat = typeof entry?.name === "string" ? entry.name : null;
            if (!cat) continue;
            const opts = Array.isArray(entry?.options) ? entry.options : [];
            const subs = opts
                .map(o => ({
                    name: String(o?.name ?? ""),
                    description:
                        typeof o?.description === "string"
                            ? o.description
                            : "No description provided"
                }))
                .filter(s => s.name.length > 0);
            categories[cat] = subs;
        } // [12]

        const categoryNames = Object.keys(categories)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b)); // [12]

        // Build command ID lookup for clickable mentions
        const app = client.application;
        await app.fetch().catch(() => {}); // ensure available [12]

        const commandIndex = new Map();
        try {
            const guild = interaction.guild;
            if (guild) {
                const guildCmds = await guild.commands
                    .fetch()
                    .catch(() => null);
                if (guildCmds)
                    for (const [, c] of guildCmds) commandIndex.set(c.name, c);
            }
            const globalCmds = await app.commands.fetch().catch(() => null);
            if (globalCmds)
                for (const [, c] of globalCmds)
                    if (!commandIndex.has(c.name)) commandIndex.set(c.name, c);
        } catch {} // [12]

        function findTopId(topName) {
            const top = commandIndex.get(topName);
            return top?.id ?? null;
        } // used in </top sub:ID> mentions [12]

        // State
        const pageSize = 6;
        let currentCategory = null; // null => Home
        let pages = [];
        let pageIndex = 0;

        // IDs
        const sid = interaction.id;
        const ids = {
            select: `help_category_${sid}`,
            prev: `help_prev_${sid}`,
            next: `help_next_${sid}`,
            letter: `help_letter_${sid}` // Home-only
        }; // [11]

        // Select options with custom emojis
        const categoryOptions = (categoryNames || []).map(cat => ({
            label: String(cat),
            value: String(cat),
            description: `${cat} commands`,
            emoji: CATEGORY_EMOJI[cat] || "📁"
        })); // [11]

        const selectRow = () =>
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(ids.select)
                    .setPlaceholder(
                        currentCategory
                            ? `Category: ${currentCategory}`
                            : "Select a category…"
                    )
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(categoryOptions)
            ); // [11]

        const pagerRow = () => {
            const total = Array.isArray(pages) ? pages.length : 0;
            const single = total <= 1;
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(ids.prev)
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(single),
                new ButtonBuilder()
                    .setCustomId(ids.next)
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(single)
            );
        }; // [11]

        const letterRow = () =>
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(ids.letter)
                    .setLabel("Letter")
                    .setEmoji("💌")
                    .setStyle(ButtonStyle.Primary)
            ); // [11]

        // Home header + tagline (Markdown)
        const homeHeader = new TextDisplayBuilder().setContent(
            "## **Blue Bot — Help**"
        ); // bold [2]
        const homeSubtitle = new TextDisplayBuilder().setContent(
            "_A handy companion for information, utilities, moderation, music, and more._" // italics [2]
        );

        // Categories list (vertical), using provided emojis
        const homeCategoriesList = () => {
            const lines = (categoryNames || []).map(cat => {
                const emoji = CATEGORY_EMOJI[cat] || "📁";
                const count = (categories[cat] || []).length;
                return `> ${BRANCH} **${emoji} ${cat}** — ${count} ${
                    count === 1 ? "command" : "commands"
                }`;
            });
            return new TextDisplayBuilder().setContent(
                lines.length ? lines.join("\n") : "_No categories found._"
            ); // italics when empty [2]
        };

        // Category header + list with clickable mentions
        const categoryHeader = () => {
            const total = Math.max(Array.isArray(pages) ? pages.length : 0, 1);
            const title = currentCategory
                ? `### __Category:__ \`${currentCategory}\` · __Page:__ ${Math.min(
                      pageIndex + 1,
                      total
                  )}/${total}` // underline + inline code [2]
                : "No category selected";
            return new TextDisplayBuilder().setContent(title);
        };

        const categoryListBlock = () => {
            const page = (Array.isArray(pages) ? pages[pageIndex] : null) ?? [];
            const topId = currentCategory ? findTopId(currentCategory) : null;
            const lines = page.map(s => {
                const mention = topId
                    ? `> </${currentCategory} ${s.name}:${topId}>`
                    : `> /${currentCategory} ${s.name}`; // clickable [12]
                const desc = (s.description || "").replace(/\n/g, " ");
                return `${BRANCH} ${mention} — ${desc}`;
            });
            return new TextDisplayBuilder().setContent(
                lines.length ? lines.join("\n") : "_No commands to show._"
            ); // [2]
        };

        // Renderers
        const renderHome = () =>
            new ContainerBuilder()
                .setAccentColor(0x1e90ff)
                .addTextDisplayComponents(homeHeader, homeSubtitle)
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(
                        SeparatorSpacingSize.Small
                    )
                )
                .addTextDisplayComponents(homeCategoriesList())
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(
                        SeparatorSpacingSize.Small
                    )
                )
                .addActionRowComponents(letterRow())
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(
                        SeparatorSpacingSize.Small
                    )
                )
                .addActionRowComponents(selectRow()); // select at very bottom [12]

        const renderCategory = () =>
            new ContainerBuilder()
                .setAccentColor(0x1e90ff)
                .addTextDisplayComponents(categoryHeader(), categoryListBlock())
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(
                        SeparatorSpacingSize.Small
                    )
                )
                .addActionRowComponents(pagerRow())
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(
                        SeparatorSpacingSize.Small
                    )
                )
                .addActionRowComponents(selectRow()); // bottom [12]

        const render = () =>
            currentCategory ? renderCategory() : renderHome(); // [12]

        // Send V2 message
        const resp = await interaction?.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [render()],
            allowedMentions: { users: [], roles: [] },
            withResponse: true
        }); // [12]

        const message = resp.resource?.message;
        if (!message) return;

        // Collector
        const collector = message.createMessageComponentCollector({
            time: 120_000,
            filter: i => i.user.id === interaction.user.id
        }); // [11]

        const recompute = cat => {
            const subs = Array.isArray(categories[cat]) ? categories[cat] : [];
            pages = chunk(subs, pageSize);
            pageIndex = 0;
        }; // [11]

        const rerender = async i => {
            await i.update({
                flags: MessageFlags.IsComponentsV2,
                components: [render()]
            }); // [12]
        };

        collector.on("collect", async i => {
            try {
                // Home-only button
                if (
                    i.isButton() &&
                    i.customId === ids.letter &&
                    !currentCategory
                ) {
                    return i.reply({
                        ephemeral: true,
                        content: `> ✨ **There are always things left unsaid,**  
> words that never find their way past the heart. 💙  
> Sometimes they arrive at the lips, trembling,  
> but fall back into silence. 🌌  
> Yet silence too has a language —  
> it speaks in *glances*, in *pauses*,  
> in the way memories echo when the world grows quiet. 🌙  



> 🌿 **Not every feeling needs an answer,**  
> not every story needs an ending. 📖  
> Some exist simply to remind us  
> that our hearts are alive,  
> capable of beating a little faster for someone 💓,  
> capable of holding warmth even when the world is cold. ❄️🔥  



> 🌸 **Perhaps that is the beauty of unspoken thoughts —**  
> they do not fade, they do not break,  
> they simply wait in corners of memory  
> like verses written on the edge of time. ⏳  
> And maybe one day, when everything else is forgotten,  
> those words will still bloom 🌼 like wildflowers in the mind,  
> quiet but unforgettable. 🌠  



🌸 *“I let you go like a flower carried away by the wind — beautiful, unforgettable, but free.”* 🌬`
                    }); // simple ephemeral reply [11]
                }

                // Category pagination
                if (i.isButton() && currentCategory) {
                    const total = Array.isArray(pages) ? pages.length : 0;
                    if (total <= 1) return i.deferUpdate();
                    if (i.customId === ids.prev) {
                        pageIndex = (pageIndex - 1 + total) % total;
                        return rerender(i);
                    }
                    if (i.customId === ids.next) {
                        pageIndex = (pageIndex + 1) % total;
                        return rerender(i);
                    }
                    return i.deferUpdate();
                }

                // Category select
                if (i.isStringSelectMenu() && i.customId === ids.select) {
                    const v = Array.isArray(i.values) ? i.values : undefined; // FIX: pick first value [11]
                    if (!v) return i.deferUpdate();
                    currentCategory = String(v);
                    recompute(currentCategory);
                    return rerender(i);
                }

                return i.deferUpdate();
            } catch (err) {
                if (i.isRepliable()) {
                    try {
                        await i.reply({
                            ephemeral: true,
                            content: `Error: ${
                                err?.message || "Unexpected error"
                            }`
                        });
                    } catch {}
                } else {
                    interaction.channel.send({
                        content: `Error: ${err?.message || "Unexpected error"}`
                    });
                }
            }
        });
    }
};
