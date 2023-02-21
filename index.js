require('./build');
const chalk = require('chalk');

console.log("Equestria.dev Power Tools");
console.log("v" + require('./package.json').version + ", build " + BuildInfo.BUILD);
console.log("");

try {
    if (!require('child_process').execSync("wget --version").toString().trim().startsWith("GNU Wget ")) {
        console.log(chalk.red("Error:") + " GNU Wget is not installed.");
    }
} catch (e) {
    console.log(chalk.red("Error:") + " GNU Wget is not installed.");
}

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