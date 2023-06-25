const fetch = require("node-fetch");
const fs = require("fs");
module.exports = () => {
    const fs = require('fs');
    const os = require('os');
    const chalk = require('chalk');
    const fetch = require('node-fetch');

    let template = `<?xml version="1.0" encoding="utf-8"?><svg preserveAspectRatio="none" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;"><image preserveAspectRatio="none" width="512" height="512" xlink:href="data:image/png;base64,%IMAGE%"></image></svg>`;

    let key = "";

    if (fs.existsSync(os.homedir() + "/.iconer.key")) {
        key = fs.readFileSync(os.homedir() + "/.iconer.key").toString().trim();
    } else {
        console.log(chalk.yellow("Warning: ") + "No git.equestria.dev access token has been found, this will prevent Iconer from gathering information about private projects. Please go to https://git.equestria.dev/user/settings/applications, create an access token with the 'repo' scope, and save it to " + os.homedir() + "/.iconer.key.\n")
    }

    console.log("Fetching initialised Git repositories...");
    let repos = fs.readdirSync(".").filter(i => {
        return fs.lstatSync(i).isDirectory() && fs.existsSync(i + "/.idea") && fs.existsSync(i + "/.git") && fs.existsSync(i + "/.git/config") && fs.readFileSync(i + "/.git/config").toString().trim().includes("[remote \"");
    });

    console.log(repos.length + " repositories have been found.");

    (async () => {
        let list = JSON.parse(Buffer.from((await ((await fetch("https://git.equestria.dev/api/v1/repos/equestria.dev/horses/contents/%2Fincludes%2Fprojects.json")).json())).content, "base64").toString());

        for (let repo of repos) {
            console.log("    " + repo);

            try {
                let data = await (await fetch("https://git.equestria.dev/api/v1/repos/equestria.dev/" + repo + "?access_token=" + encodeURIComponent(key))).json();

                if (data.errors) throw new Error(data.message ?? null);

                console.log("        Icon: " + data['avatar_url'] ?? "(none)");
                console.log("        Name: " + list[repo] ?? repo);

                fs.writeFileSync("./" + repo + "/.idea/.name", (list[repo] ?? repo).trim());

                if (data['avatar_url']) {
                    fs.writeFileSync("./" + repo + "/.idea/icon.svg", template.replace("%IMAGE%", Buffer.from(await (await fetch(data['avatar_url'])).arrayBuffer()).toString("base64")));
                } else if (fs.existsSync("./" + repo + "/.idea/icon.svg")) {
                    fs.unlinkSync("./" + repo + "/.idea/icon.svg");
                }
            } catch (e) {
                console.log("        Failed to get information, it is possible that the Git repository does not exist or you don't have access to it.\n        The error was: " + e.message);

                if (fs.existsSync("./" + repo + "/.idea/icon.svg")) fs.unlinkSync("./" + repo + "/.idea/icon.svg");
                if (fs.existsSync("./" + repo + "/.idea/.name")) fs.unlinkSync("./" + repo + "/.idea/.name");
            }
        }
    })();
}