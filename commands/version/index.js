module.exports = () => {
    const chalk = require('chalk');

    console.log(chalk.magenta("Equestria.dev Power Tools"));
    console.log("  Version " + chalk.bold(require('../../package.json').version) + ", build " + chalk.bold(BuildInfo.BUILD));
    console.log("  Built against NodeJS " + chalk.bold(BuildInfo.VERSION) + " as " + BuildInfo.SOURCE_USER);
    console.log("  Running on NodeJS " + chalk.bold(process.versions.node));
    console.log("  Source: " + chalk.bold(BuildInfo.SOURCE_DIR));
    console.log("  Build Date: " + chalk.bold(new Date(BuildInfo.DATE).toISOString()));
    console.log("");
    console.log("This build of Power Tools has " + chalk.bold(Object.keys(require('../_loader')).length) + " commands, run 'pt help' for a list.");
}