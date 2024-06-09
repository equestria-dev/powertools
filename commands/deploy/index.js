const cp = require("child_process");
module.exports = () => {
    const fs = require('fs');
    const os = require('os');
    const cp = require('child_process');

    if (fs.existsSync("./powertools.json")) {
        if (fs.existsSync(os.userInfo().homedir + "/.deploy.txt")) {
            let token = fs.readFileSync(os.userInfo().homedir + "/.deploy.txt").toString().trim();
            let config = JSON.parse(fs.readFileSync("./powertools.json").toString());

            console.log("Package: " + config.name);
            let version;

            if (config.version.startsWith("@")) {
                version = eval(config.version.substring(1));
            } else {
                version = config.version;
            }

            console.log("Deploying version " + version);

            for (let file of Object.keys(config.files)) {
                if (fs.existsSync(config.files[file])) {
                    console.log("Uploading " + file);
                    cp.execFileSync("curl", [
                        "--header", "PRIVATE-TOKEN: " + token,
                        "--upload-file", config.files[file],
                        "https://source.equestria.dev/api/v4/groups/2/packages/generic/" + config.name + "/" + version + "/" + file
                    ]);
                } else {
                    console.log("Ignoring " + file + " because the requested file (" + config.files[file] + ") does not exist.");
                }
            }
        } else {
            console.log("Could not find a '~/.deploy.txt' file with your GitLab access token.");
        }
    } else {
        console.log("Could not find a 'powertools.json' file for this project.");
    }
}