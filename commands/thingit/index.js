const fs = require("node:fs");
const cp = require("child_process");
const prompts = require('prompts');
const _getSize = require('get-folder-size');
const child_process = require("node:child_process");

function getSize(folder) {
    return new Promise((res, rej) => {
        _getSize(folder, (err, size) => {
            if (err) rej(err);
            res(size);
        })
    });
}

function prettySize(s) {
    if (s < 1024) {
        return s + "B";
    } else if (s < 1024**2) {
        return (s / 1024).toFixed(1) + " KiB";
    } else if (s < 1024**3) {
        return (s / 1024**2).toFixed(1) + " MiB";
    } else if (s < 1024**4) {
        return (s / 1024**3).toFixed(1) + " GiB";
    }
}

module.exports = () => {
    (async () => {
        if (process.platform !== "darwin" && process.platform !== "linux") {
            console.log("Sorry, this program only works on macOS and Linux.");
            process.exit(1);
        }

        console.log("Current directory: " + process.cwd());
        console.log("Looking for valid Git repositories...");

        let repos = [];
        let sizes = {};

        for (let file of fs.readdirSync(".")) {
            process.stdout.write("    " + file + ": ");

            if (fs.lstatSync(file).isDirectory()) {
                process.stdout.write("directory");

                if (fs.existsSync(file + "/.git")) {
                    process.stdout.write(", has .git");

                    if (fs.existsSync(file + "/.git/config")) {
                        process.stdout.write(", has config");

                        if (fs.readFileSync(file + "/.git/config").toString().includes("[remote \"origin\"]")) {
                            process.stdout.write(", has origin remote");
                            repos.push(file);
                            sizes[file] = [await getSize(file), null];

                            process.stdout.write(", valid (" + prettySize(sizes[file][0]) + ")");
                        } else {
                            process.stdout.write(", invalid");
                        }
                    } else {
                        process.stdout.write(", invalid");
                    }
                } else {
                    process.stdout.write(", invalid");
                }
            } else {
                process.stdout.write("invalid");
            }

            process.stdout.write("\n");
        }

        if (repos.length > 0) {
            console.log("Found " + repos.length + " repositories, taking up " + prettySize(Object.values(sizes).map(i => i[0]).reduce((a, b) => a + b)));
            console.log("");
            console.log("Before you start, please note:");
            console.log("  * Thinning Git repositories removes the local copy of commits that have been pushed to the server.");
            console.log("  * This means you may not be able to revert commits offline or at all.");
            console.log("  * Uncommited changes will automatically be commited (but not pushed).");
            console.log("  * There may be other unforeseen errors due to this process.");
            console.log("  * This does not remove the commits and history from the server.");
            console.log("  * This cannot be reverted without cloning the entire repository again.");
            console.log("  * If you can, please take a disk snapshot before you run this process.");
            console.log("     * On macOS, run \"tmutil localsnapshot\" in a Terminal.");
            console.log("  * Make sure you have sufficient disk space available to back up Git repositories.");
            console.log("");

            if ((await prompts({
                type: "confirm",
                name: "confirm",
                message: "Do you accept the risk and want to continue?"
            })).confirm) {
                for (let file of repos) {
                    console.log("=> " + file);

                    console.log("==> " + file + ": Backing up .git folder");
                    child_process.execSync("cp -r .git ../.git.bak", { cwd: file, stdio: "inherit" });

                    try {
                        console.log("==> " + file + ": Pulling commits from the server");
                        child_process.execSync("git fetch --all", { cwd: file, stdio: "inherit" });

                        try {
                            child_process.execSync("git branch -r | grep -v '\\->' | while read remote; do git branch --track \"${remote#origin/}\" \"$remote\"; done", { cwd: file, stdio: "inherit" })
                        } catch (e) {
                            console.error(e);
                        }

                        try {
                            child_process.execSync("git pull --all", { cwd: file, stdio: "inherit" });
                        } catch (e) {
                            console.error(e);
                            child_process.execSync("git pull origin mane", { cwd: file, stdio: "inherit" });
                        }

                        console.log("==> " + file + ": Tracking untracked files");
                        child_process.execSync("git add -A", { cwd: file, stdio: "inherit" });

                        console.log("==> " + file + ": Looking for uncommited changes");

                        if (child_process.execSync("git status --porcelain", { cwd: file, stdio: "pipe" }).toString().trim() !== "") {
                            console.log("==> " + file + ": Found uncommited changes, creating commit");
                            child_process.execSync("git commit -m \"Thingit: Before repository thinning\"", { cwd: file, stdio: "inherit" });
                        }

                        console.log("==> " + file + ": Fetching latest commit");
                        child_process.execSync("git fetch --depth 1", { cwd: file, stdio: "inherit" });

                        console.log("==> " + file + ": Marking unreachable commits for deletion");
                        child_process.execSync("git reflog expire --expire-unreachable=now --all", { cwd: file, stdio: "inherit" });

                        console.log("==> " + file + ": Running garbage collector");
                        child_process.execSync("git gc --aggressive --prune=all", { cwd: file, stdio: "inherit" });

                        console.log("==> " + file + ": Calculating new size");
                        sizes[file][1] = await getSize(file);

                        console.log("==> " + file + ": Removing backup");
                        child_process.execSync("rm -rf ../.git.bak", { cwd: file, stdio: "inherit" });

                        console.log("==> " + file + ": Finished. New local size is " + prettySize(sizes[file][1]) + ".");
                    } catch (e) {
                        console.error(e);

                        console.log("\n==> " + file + ": Thinning failed, restoring from backup");
                        child_process.execSync("rm -rf .git", { cwd: file, stdio: "inherit" });
                        child_process.execSync("cp -r ../.git.bak .git", { cwd: file, stdio: "inherit" });
                        child_process.execSync("rm -rf ../.git.bak", { cwd: file, stdio: "inherit" });

                        console.log("== Stopping here because thinning failed for a repository.");
                        process.exit(2);
                    }
                }

                console.log("");
                console.log("Done thinning all repositories.");

                let oldSize = Object.values(sizes).map(i => i[0]).reduce((a, b) => a + b);
                let newSize = Object.values(sizes).map(i => i[1]).reduce((a, b) => a + b);

                console.log(prettySize(oldSize) + " -> " + prettySize(newSize) + " (" + (((oldSize - newSize) / oldSize) * 100).toFixed(2) + "% decrease, fred up " + prettySize(oldSize - newSize) + ")");
            } else {
                console.log("No files were affected, have a nice day!");
            }
        } else {
            console.log("Could not find any valid Git repositories. Please make sure this directory contains valid Git repositories with an \"origin\" remote.");
        }
    })();
}