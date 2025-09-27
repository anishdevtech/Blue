const { connect } = require("mongoose");
const config = require("../config");
const { log } = require("../functions");
const chalk = require("chalk");

module.exports = async () => {
    const uri = process.env.MONGODB_URI || config.handler.mongodb.uri;
    // Try to parse cluster and db name from URI
    let cluster = "unknown",
        dbname = "unknown";
    try {
        const match = uri.match(
            /mongodb(?:\+srv)?:\/\/(?:.+@)?([\w\.\-]+)\/([\w\-]+)?/i
        );
        if (match) {
            cluster = match[1];
            dbname = match[2] || "admin";
        }
    } catch {}

    // Start timer
    const start = Date.now();

    // Initial tree log
    console.log(chalk.yellow("\n┣━━━━━━━━━━ Database Connection ━━━━━━━━━━"));
    console.log(
        chalk.cyan("┃ ├─ Engine      : ") + chalk.greenBright("MongoDB Atlas")
    );
    console.log(chalk.cyan("┃ ├─ Cluster     : ") + chalk.blueBright(cluster));
    console.log(chalk.cyan("┃ ├─ Database    : ") + chalk.white(dbname));
    console.log(chalk.cyan("┃ ├─ URI         : ") + chalk.gray(uri));
    console.log(
        chalk.cyan("┃ └─ Status      : ") + chalk.blueBright("Connecting…")
    );
    
            console.log(
                chalk.yellow("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
            );

    //log("Started connecting to MongoDB...", "warn");

    await connect(uri)
        .then(() => {
            const end = Date.now();
            const seconds = ((end - start) / 1000).toFixed(2);

           console.log(chalk.yellow("\n┣━━━━━━━━━━ Database Update ━━━━━━━━━━"));
 console.log(
                chalk.cyan("┃ ├─ Status      : ") +
                    chalk.greenBright("✔ Connected")
            );
            console.log(
                chalk.cyan("┃ └─ Time Taken  : ") +
                    chalk.magentaBright(`${seconds}s`)
            );
            console.log(
                chalk.yellow("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
            );
            // log("MongoDB is connected to the atlas!", "done");
        })
        .catch(err => {
            const end = Date.now();
            const seconds = ((end - start) / 1000).toFixed(2);
            console.log(chalk.cyan("┃"));
            console.log(
                chalk.cyan("┃ ├─ Status      : ") +
                    chalk.redBright("✖ Connection Failed")
            );
            console.log(
                chalk.cyan("┃ └─ Time Taken  : ") +
                    chalk.magentaBright(`${seconds}s`)
            );
            console.log(chalk.red(err));
            console.log(
                chalk.yellow("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
            );
            log("Failed to connect to MongoDB!", "error");
        });
};
