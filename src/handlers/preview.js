const figlet = require("figlet");
const chalk = require("chalk");
module.exports = (client) => {
  // Show a huge, bold BLUE banner
  console.log(
    chalk.bold.blue(
      figlet.textSync("BLUE", {
        font: "Big", // Try "ANSI Shadow", "Block", etc for different looks!
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
}