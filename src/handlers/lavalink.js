const { readdirSync, statSync } = require("fs");
const path = require("path");
const chalk = require("chalk");

module.exports = client => {
    const rootPath = path.join(__dirname, "../events/Lavalink");

    // Recursively get all .js files from subdirectories
    function getFiles(dir, folders = []) {
        let list = [];
        readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
            const resolved = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                list.push(...getFiles(resolved, [...folders, dirent.name]));
            } else if (dirent.name.endsWith(".js")) {
                list.push({
                    file: resolved,
                    relFolder: folders.join("/") || "."
                });
            }
        });
        return list;
    }

    const allEventFiles = getFiles(rootPath);
    console.log(chalk.blueBright("\n┏━━━ Lavalink Event Handlers Loaded ━━━┓"));

    // Define event sets for cleaner mapping
    const nodeEvents = [
        "raw",
        "disconnect",
        "connect",
        "reconnecting",
        "create",
        "destroy",
        "error",
        "resumed"
    ];
    const playerEvents = [
        "playerCreate",
        "playerDestroy",
        "playerDisconnect",
        "playerMove",
        "playerSocketClosed",
        "playerUpdate"
    ];
    const trackEvents = [
        "trackStart",
        "trackStuck",
        "trackError",
        "trackEnd",
        "queueEnd",
        "queueChangesWatcher"
    ];

    allEventFiles.forEach(({ file, relFolder }) => {
        const eventModule = require(file);
        const prettyFile = file.split("/events/Lavalink/")[1];

        if (!eventModule.event || typeof eventModule.run !== "function") {
            console.log(
                chalk.red(
                    `  ✖ Skipped: ${prettyFile} (missing 'event' or 'run' function)`
                )
            );
            return;
        }

        if (nodeEvents.includes(eventModule.event)) {
            client.lavalink.nodeManager.on(eventModule.event, (...args) =>
                eventModule.run(client, ...args)
            );
            console.log(
                chalk.cyan(`  ┣ [NodeManager] ${eventModule.event.padEnd(15)}`)
            );
        } else if (playerEvents.includes(eventModule.event)) {
            client.lavalink.on(eventModule.event, (...args) =>
                eventModule.run(client, ...args)
            );
            console.log(
                chalk.yellow(
                    `  ┣ [Player]      ${eventModule.event.padEnd(15)} `
                )
            );
        } else if (trackEvents.includes(eventModule.event)) {
            client.lavalink.on(eventModule.event, (...args) =>
                eventModule.run(client, ...args)
            );
            console.log(
                chalk.green(
                    `  ┣ [Track]       ${eventModule.event.padEnd(15)} `
                )
            );
        } else {
            client.lavalink.on(eventModule.event, (...args) =>
                eventModule.run(client, ...args)
            );
            console.log(
                chalk.white(
                    `  ┣ [Other]       ${eventModule.event.padEnd(
                        15
                    )} (${relFolder}/${path.basename(file)})`
                )
            );
        }
    });

    console.log(chalk.blueBright("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n"));
};
