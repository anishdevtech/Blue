const chalk = require("chalk");

module.exports = {
    event: "connect",
    run: (client, node) => {
        const id = node.options.identifier || node.options.host || "unknown";
        const host = node.options.host || "?";
        const port = node.options.port || "?";
        const ssl = node.options.secure || port === "443";
        const protocol = ssl ? "https" : "http";
        const version = node.version || "?";
        const alive = node.isAlive
            ? chalk.greenBright("✔ Online")
            : chalk.redBright("✖ Offline");

        console.log(
            chalk.blueBright("\n┣━━━━━━━━━━ Node Connected ━━━━━━━━━━")
        );
        console.log(chalk.bold(`${chalk.cyan("┃ ")}${chalk.blueBright(id)}`));
        console.log(
            chalk.cyan("┃ ├─ Host     : ") +
                chalk.white(
                    `${host}:${port}`
                )
        );
        console.log(chalk.cyan("┃ ├─ Version  : ") + chalk.white(version));
        console.log(chalk.cyan("┃ └─ Status   : ") + alive);
        console.log(chalk.blueBright("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
    }
};
