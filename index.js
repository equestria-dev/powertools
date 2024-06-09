require('./build');
const chalk = require('chalk');
const commands = require("./commands/_loader");

console.log("Equestria.dev Power Tools");
console.log("build " + BuildInfo.BUILD + ", " + new Date(BuildInfo.DATE).toISOString().split("T")[0]);
console.log("");

try {
    if (!require('child_process').execSync("wget --version", { stdio: "pipe" }).toString().trim().startsWith("GNU Wget ")) {
        console.log(chalk.yellow("Warning:") + " GNU Wget is not installed, some features (such as over-the-air updates) will not be functional.");
    }
} catch (e) {
    console.log(chalk.yellow("Warning:") + " GNU Wget is not installed, some features (such as over-the-air updates) will not be functional.");
}

require('./updater')().then(() => {
    let command = process.argv[2];

    if (command) {
        const commands = require('./commands/_loader');

        if (commands[command]) {
            console.log(chalk.gray("=> " + command) + "\n");
            process.argv.splice(2, 1);
            commands[command]();
        } else {
            console.log(chalk.red("Error: ") + "Command \"" + command + "\" not found");
        }
    } else {
        console.log(chalk.red("Error: ") + "No command provided");
        console.log("Use 'pt version' for version info.")
        console.log("Use 'pt help' for a list of possible commands.")
    }
});