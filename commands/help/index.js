module.exports = () => {
    const chalk = require('chalk');

    console.log("Equestria.dev Power Tools");
    console.log("  A collection of CLI tools to ease different tasks at Equestria.dev");
    console.log("");

    let list = require('../_loader');

    let docs = {
        deploy: "Deploy a package to the Equestria.dev package repository",
        derpilist: "Saves a list of search results from Derpibooru",
        derpisync: "Syncs your Derpibooru favorites with a local copy",
        version: "Show the Power Tools version",
        update: "Update Power Tools to the latest version",
        boorudl: "Download images from a Derpibooru tag",
        help: "Show this help message",
        musicdl: "Download music from various platforms",
        autopush: "Commit and push Git repositories",
        backup: "Backup any directory elsewhere",
        iconer: "Add icons to IntelliJ projects"
    }

    let longest = Math.max(...Object.keys(list).map(i => i.length));

    for (let command in list) {
        process.stdout.write("  " + chalk.bold(command) + "  " + " ".repeat(longest - command.length) + (docs[command] ? docs[command] : chalk.gray("No help provided")) + "\n");
    }
}