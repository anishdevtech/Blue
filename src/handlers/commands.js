const { readdirSync } = require("fs");
const path = require("path");
const chalk = require("chalk");
const ExtendedClient = require("../class/ExtendedClient");
//const { log } = require("../functions.js");

const categoryEmojis = {
  Developers: "👨‍💻",
  Info: "💡",
  Utility: "🔧",
  Music: "🎵",
  Mod: "🛡️",
  Ticket: "🎫",
  Config: "⚙️",
  // Add or update as needed
};

/**
 * @param {ExtendedClient} client
 */
module.exports = client => {
  const categories = readdirSync("./src/commands/");
  const commandsByCategory = {};

  categories.forEach(category => {
    const commandDirs = readdirSync(`./src/commands/${category}`);
    commandDirs.forEach(dir => {
      const commandFiles = readdirSync(
        `./src/commands/${category}/${dir}`
      ).filter(file => file.endsWith(".js"));
      const subcommands = [];

      commandFiles.forEach(file => {
        const command = require(
          path.join(
            __dirname,
            `../commands/${category}/${dir}/${file}`
          )
        );
        if (!command.structure?.name || !command.run) {
          console.log(
            chalk.hex("#3a9bdc")(`✖ Unable to load the command ${file} (missing 'structure#name' or/and 'run').`)
          );
          return;
        }

        //log(`Loading ${command.structure.name} from ${dir} category.`, "info");
        subcommands.push(command.structure);

        if (!commandsByCategory[dir]) commandsByCategory[dir] = [];
        commandsByCategory[dir].push(command.structure.name);

        client.collection.interactioncommands.set(
          command.structure.name,
          command
        );
      });

      const processDescription = ({ description }) => ({
        description: description
          ? description.trim() === ''
            ? 'No description found'
            : description
          : 'No description found'
      });

      client.applicationcommandsArray.push({
        name: dir.toLowerCase(),
        description: `${dir} commands`,
        options: subcommands.map(sub => ({
          type: 1,
          name: sub.name,
          ...processDescription(sub),
          options: sub.options || []
        }))
      });

      client.collection.slashCat.set(dir, category);
    });
  })
  
  // Blue-themed tree output
  const catColor = chalk.hex("#1e90ff").bold;   // Deep blue for category
  const branchColor = chalk.hex("#66b2ff");     // Lighter blue for branches
  const cmdColor = chalk.hex("#cfe6fa");        // Pale blue for command text
  const successColor = chalk.hex("#37cfff").bold; // Bright cyan for count

  console.log(catColor("\n┏━━━━━━━━━ Slash Commands Loaded ━━━━━━━━━┓"));

  Object.entries(commandsByCategory).forEach(([category, commands]) => {
    const emoji = categoryEmojis[category] || "";
    console.log(catColor(`┣━ ${emoji} ${category}`));
    const lastCmdIdx = commands.length - 1;
    commands.forEach((cmd, idx) => {
      const branch = idx === lastCmdIdx ? "└──" : "├──";
      console.log(branchColor(`┃  ${branch} `) + cmdColor(cmd));
    });
    // Print total
    console.log(branchColor(`┃  `) + successColor(`✅ ${commands.length} command${commands.length !== 1 ? "s" : ""} loaded\n`));
  });

  console.log(catColor("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"));
};
