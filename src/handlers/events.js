const { readdirSync } = require('fs');
const { log } = require('../functions');
const ExtendedClient = require('../class/ExtendedClient');

/**
 * 
 * @param {ExtendedClient} client 
 */
module.exports = (client) => {
    // Gather event files by category (folder)
    const eventsByCategory = {};

    for (const dir of readdirSync('./src/events/')) {
        const eventFiles = readdirSync('./src/events/' + dir)
            .filter((f) => f.endsWith('.js'));
        eventsByCategory[dir] = [];

        eventFiles.forEach(file => {
            const module = require('../events/' + dir + '/' + file);

            if (!module) return;
            if (!module.event || !module.run) {
                log(
                    `Unable to load the event ${file} due to missing 'event' or/and 'run' properties.`,
                    'warn'
                );
                return;
            }

        //    log(`Loaded new event: ${file}`, 'info');
            eventsByCategory[dir].push(file);

            if (module.once) {
                client.once(module.event, (...args) => module.run(client, ...args));
            } else {
                client.on(module.event, (...args) => module.run(client, ...args));
            }
        });
    }

    // Print tree-style summary
    console.log('\n' + '┏━━━━━━━━━━ Event Handlers Loaded ━━━━━━━━━━┓');
    Object.entries(eventsByCategory).forEach(([category, files]) => {
        console.log(`┣━ ${category}`);
        const lastIdx = files.length - 1;
        files.forEach((file, idx) => {
            const branch = idx === lastIdx ? '└──' : '├──';
            console.log(`┃  ${branch} ${file}`);
        });
        console.log(`┃  ✅ ${files.length} event${files.length !== 1 ? "s" : ""} loaded`);
    });
    console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
};
