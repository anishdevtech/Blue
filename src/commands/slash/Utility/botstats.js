const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    version: djsVersion,
    time,
    TimestampStyles
} = require("discord.js");
const os = require("os");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName("botstats")
        .setDescription("Show bot runtime and responsiveness.")
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

    run: async (client, interaction) => {
        const rid = Math.random().toString(36).slice(2, 8);
        const apiPing = Math.round(client.ws.ping); // [7]
        const mem = process.memoryUsage();
        const rssMB = (mem.rss / 1024 / 1024).toFixed(1);
        const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
        const startedAtSec = Math.floor(
            (Date.now() - process.uptime() * 1000) / 1000
        );
        const uptimeAbs = time(startedAtSec, TimestampStyles.LongDateTime); // [8]
        const uptimeRel = time(startedAtSec, TimestampStyles.RelativeTime); // [8]
        const cpuLoad1m = os.loadavg?.()?.toFixed?.(2) ?? "N/A";
        const shardId = 0; //client.shard?.ids ?? 0;
        const shardCount = client.shard?.count ?? 1;

        console.log(
            JSON.stringify({
                level: "INFO",
                scope: "botstats",
                rid,
                apiPing,
                rssMB,
                heapMB,
                cpuLoad1m,
                shardId,
                shardCount
            })
        );

        const embed = new EmbedBuilder()
            .setTitle("Bot stats")
            .setColor("Blue")
            .setDescription(
                "**System overview** with current responsiveness and resource usage."
            ) // [7]
            .addFields(
                {
                    name: "Latency",
                    value: `• **Discord API:** \`${apiPing} ms\``,
                    inline: false
                },
                {
                    name: "Uptime",
                    value: `• **Started:** ${uptimeAbs}\n• **Since:** ${uptimeRel}`,
                    inline: false
                }, // [8]
                {
                    name: "Resources",
                    value: `• **RAM:** \`${rssMB} MB RSS\` / \`${heapMB} MB heap\`\n• **CPU (1m):** \`${cpuLoad1m}\`\n• **Shard:** \`${
                        shardId + 1
                    }/${shardCount}\``,
                    inline: false
                }
            )
            .setFooter({
                text: `Node ${process.version} · discord.js v${djsVersion}`
            }); // [7]

        await interaction.reply({ embeds: [embed] });
    }
};
