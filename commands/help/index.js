module.exports = () => {
    const chalk = require('chalk');

    console.log("Equestria.dev Power Tools");
    console.log("  A collection of CLI tools to ease different tasks at Equestria.dev");
    console.log("");

    let list = require('../_loader');

    let docs = {
        version: "Show the Power Tools version",
        boorudl: "Download images from a Derpibooru tag",
        help: "Show this help message",
        musicdl: "Download music from various platforms",
        autopush: "Commit and push Git repositories",
        ponybadge: "Install and update PonyBadge on Badger 2040W devices"
    }

    let longest = Math.max(...Object.keys(list).map(i => i.length));

    for (let command in list) {
        process.stdout.write("  " + chalk.bold(command) + "  " + " ".repeat(longest - command.length) + (docs[command] ? docs[command] : chalk.gray("No help provided")) + "\n");
    }
}