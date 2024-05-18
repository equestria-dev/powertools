module.exports = () => {
    const chalk = require('chalk');

    console.log("Equestria.dev Power Tools");
    console.log("  A collection of CLI tools to ease different tasks at Equestria.dev");
    console.log("");

    let list = require('../_loader');

    let docs = {
        version: "Show the Power Tools version",
        update: "Update Power Tools to the latest version",
        help: "Show this help message",
        autopush: "Commit and push Git repositories",
        thingit: "Make Git repositories thinner to save disk space"
    }

    let longest = Math.max(...Object.keys(list).map(i => i.length));

    for (let command in list) {
        process.stdout.write("  " + chalk.bold(command) + "  " + " ".repeat(longest - command.length) + (docs[command] ? docs[command] : chalk.gray("No help provided")) + "\n");
    }
}
