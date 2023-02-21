module.exports = () => {
    const child_process = require('node:child_process');

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function exec(name, args, options) {
        return new Promise((res, rej) => {
            try {
                child_process.execFile(name, args, options ?? {}, (error, stdout, stderr) => {
                    if (error) {
                        rej(error);
                        return;
                    }

                    res(stdout, stderr);
                })
            } catch (e) {
                rej(e);
            }
        })
    }

    (async () => {
        const version = "1.3";

        const chalk = require('chalk');
        const prompts = require('prompts');
        const fs = require('node:fs');

        console.log("autopush v" + version);
        console.log("(c) Equestria.dev Developers");
        console.log("");

        let archives = false;
        if (fs.existsSync("./._")) archives = true;

        let list = fs.readdirSync(".").filter(i => {
            try {
                let isDotFile = i.startsWith(".")
                let isDirectory = fs.lstatSync("./" + i).isDirectory();

                if (!isDirectory && fs.lstatSync("./" + i).isSymbolicLink()) {
                    isDirectory = fs.lstatSync(fs.readlinkSync("./" + i)).isDirectory();
                }

                return !isDotFile && isDirectory;
            } catch (e) {
                return false;
            }
        });

        for (let file of list) {
            process.stdout.write(chalk.gray("[" + file + "] ") + "Initialising...")
            let root = fs.realpathSync("./" + file);

            try {
                if (fs.existsSync(root + "/.git")) {
                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                    process.stdout.write(chalk.gray("[" + file + "] ") + "Adding files...");
                    await exec("git", ["add", "-A"], { cwd: root });

                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                    process.stdout.write(chalk.gray("[" + file + "] ") + "Generating commit message...");
                    let changes = child_process.execSync("git status --porcelain", {cwd: root}).toString().trim();

                    if (changes === "") {
                        process.stdout.cursorTo(0); process.stdout.clearLine(null);
                        process.stdout.write(chalk.gray("[" + file + "] ") + "No changes since last commit");
                    } else {
                        let changed = changes.split("\n").map(i => i.trim().replace(/ +/g, " ").split(" ")[0].substring(0, 1));
                        let amounts = {};

                        for (let change of changed) {
                            if (!amounts[change]) amounts[change] = 0;
                            amounts[change] += 1;
                        }

                        let message = "";
                        let parts = [];
                        let firstPart = true;

                        for (let action of [
                            { code: "M", name: "updated" },
                            { code: "T", name: "changed type for" },
                            { code: "A", name: "added" },
                            { code: "D", name: "deleted" },
                            { code: "R", name: "renamed" },
                            { code: "C", name: "copied" },
                        ]) {
                            if (amounts[action.code]) {
                                if (amounts[action.code] > 1) {
                                    if (firstPart) {
                                        firstPart = false;
                                        parts.push(capitalizeFirstLetter(action.name) + " " + amounts[action.code] + " files");
                                    } else {
                                        parts.push(action.name + " " + amounts[action.code] + " files");
                                    }
                                } else {
                                    let fileName = changes.split("\n").filter(i => i.startsWith(action.code))[0].trim().replace(/ +/g, " ").split(" ")[1];

                                    if (firstPart) {
                                        firstPart = false;
                                        parts.push(capitalizeFirstLetter(action.name) + " " + fileName);
                                    } else {
                                        parts.push(action.name + " " + fileName);
                                    }
                                }
                            }
                        }

                        let index = 0;

                        for (let part of parts) {
                            if (index === 0) {
                                message += part;
                            } else if (index >= parts.length - 1) {
                                message += " and " + part;
                            } else {
                                message += ", " + part;
                            }

                            index++;
                        }

                        message += " (automated)";

                        process.stdout.cursorTo(0); process.stdout.clearLine(null);
                        process.stdout.write(chalk.gray("[" + file + "] ") + "Making commit...");
                        await exec("git", ["commit", "-m", message], { cwd: root });

                        process.stdout.cursorTo(0); process.stdout.clearLine(null);
                        process.stdout.write(chalk.gray("[" + file + "] ") + "Pushing to remote...");
                        await exec("git", ["push", "--all", "--force", "origin"], { cwd: root });

                        process.stdout.cursorTo(0); process.stdout.clearLine(null);
                        process.stdout.write(chalk.gray("[" + file + "] ") + "Completed");
                    }
                } else {
                    process.stdout.cursorTo(0); process.stdout.clearLine(null);

                    let completed = false;

                    while (!completed) {
                        let response = null;

                        while (!response || Object.keys(response).length === 0) {
                            response = await prompts({
                                type: 'select',
                                name: 'value',
                                hint: 'What should be done?',
                                message: chalk.bold(file) + " does not contain a Git repository",
                                choices: [
                                    { title: "Ignore this project", value: "ignore" },
                                    { title: "Create a new repository", value: "create" },
                                    archives ? { title: "Move project to archive", value: "archive" } : null,
                                    { title: "Delete this project", value: "delete" },
                                    { title: "Quit Autopush", value: "quit" },
                                ].filter(i => i),
                                initial: 0
                            });
                        }

                        let response2 = null;

                        switch (response.value) {
                            case "ignore":
                                completed = true;
                                process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                process.stdout.write(chalk.gray("[" + file + "] ") + "No Git repository");
                                break;

                            case "archive":
                                fs.renameSync("./" + file, "./._/" + file);
                                completed = true;
                                process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                process.stdout.write(chalk.gray("[" + file + "] ") + "Moved to archive");
                                break;

                            case "create":
                                while (!response2 || Object.keys(response2).length === 0) {
                                    response2 = await prompts({
                                        type: 'text',
                                        name: 'value',
                                        message: 'Enter the URL to the Git repository'
                                    });
                                }

                                try {
                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + "Initialising repository...");
                                    await exec("git", ["init"], { cwd: root });

                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + "Adding files...");
                                    await exec("git", ["add", "-A"], { cwd: root });

                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + "Making commit...");
                                    await exec("git", ["commit", "-m", "Initial commit"], { cwd: root });

                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + "Adding remote...");
                                    await exec("git", ["remote", "add", "origin", response2.value], { cwd: root });

                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + "Pushing to remote...");
                                    await exec("git", ["push", "--all", "origin"], { cwd: root })

                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + "Completed");
                                    completed = true;
                                } catch (e) {
                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + e.message);
                                    completed = true;
                                }

                                break;

                            case "delete":
                                while (!response2 || Object.keys(response2).length === 0) {
                                    response2 = await prompts({
                                        type: 'confirm',
                                        name: 'value',
                                        message: "Do you really want to delete this project permanently? This cannot be undone.",
                                        initial: false
                                    });
                                }

                                if (response2.value) {
                                    completed = true;
                                    fs.rmSync(root, { recursive: true });
                                    process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                    process.stdout.write(chalk.gray("[" + file + "] ") + "Deleted project");
                                }

                                break;

                            case "quit":
                                completed = true;
                                process.stdout.cursorTo(0); process.stdout.clearLine(null);
                                process.stdout.write(chalk.gray("[" + file + "] ") + "No Git repository");
                                process.exit(1);
                        }
                    }
                }
            } catch (e) {
                process.stdout.cursorTo(0); process.stdout.clearLine(null);
                process.stdout.write(chalk.gray("[" + file + "] ") + e.message.split("\n")[0]);
                process.exit(1);
            }
        }

        console.log("");
    })();
}