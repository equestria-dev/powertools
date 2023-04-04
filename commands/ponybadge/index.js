const chalk = require("chalk");
module.exports = async () => {
    console.log("ponybadge-tools v1.0.0");
    console.log("(c) Equestria.dev Developers\n");

    const chalk = require('chalk');
    const prompts = require('prompts');

    if (process.argv[2]) {
        switch (process.argv[2]) {
            case "help":
                console.log("Available commands:");
                console.log("    install          Install PonyBadge to your device");
                console.log("    update           Update your device over the cable");
                console.log("    config           Change a configuration option");
                console.log("    info             Get information about your device");
                console.log("    help             Show an help message");
                break;

            case "install":
                console.log(chalk.yellow("WARNING:") + " Make ABSOLUTELY sure the device you are installing PonyBadge to is a Badger 2040W by Pimoroni. PonyBadge is NOT compatible with the Badger 2040 or other devices. Installing PonyBadge on other devices may permanently damage your device.");
                console.log("");
                await prompts.confirm("Are you sure the device you are installing PonyBadge to is a Badger 2040W?")

            default:
                console.log(chalk.red("Error: ") + "Unrecognised command; run 'pt ponybadge help' to get help");
                break;
        }
    } else {
        console.log(chalk.red("Error: ") + "No command specified; run 'pt ponybadge help' to get help");
    }
}