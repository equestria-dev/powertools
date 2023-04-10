const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

let list = [];

let ignore = [
    "./Library/Application Support/CloudDocs",
    "./Library/Saved Application State",
    "./Library/CloudStorage",
    "./Library/Group Containers",
    "./Library/Application Support/FileProvider",
    "./Library/Containers/com.utmapp.UTM",
    "./.TemporaryItems",
    "./.Trashes",
    "./.fseventsd",
    "./.Spotlight-V100",
    "./.DocumentRevisions-V100",
    "./.Trash",
    "./.cache",
    "./Library/Caches",
    "./.gradle",
    "./.android",
    "./.local/share/Trash",
    "./.cargo"
];

let currentCollectionSize = 0;
let copySize = 0;
let copiedSize = 0;
let copiedSizeBefore = 0;
let copiedFiles = 0;
let absoluteSpeed = 0;
let currentFile = "-";
let copying = false;
let currentFileSize = 0;
let currentCopiedSize = 0;
let speeds = [];
let speed = 0;

function formatETA(eta) {
    if (!isFinite(eta)) {
        eta = "-";
    } else if (eta > 3600) {
        eta = Math.floor(eta / 3600).toString() + " hours";
    } else if (eta > 60) {
        eta = Math.floor(eta / 60).toString() + " minutes";
    } else {
        eta = Math.floor(eta).toString() + " seconds";
    }

    return eta;
}

function formatSize(size) {
    let value = Math.abs(size);

    if (value > 1024) {
        if (value > 1024**2) {
            if (value > 1024**3) {
                if (value > 1024**4) {
                    return (value / 1024**4).toFixed(2) + " TiB";
                } else {
                    return (value / 1024**3).toFixed(2) + " GiB";
                }
            } else {
                return (value / 1024**2).toFixed(2) + " MiB";
            }
        } else {
            return (value / 1024).toFixed(2) + " KiB";
        }
    } else {
        return value + " B";
    }
}

function updateUI() {
    let text;

    text = Math.round((copiedSize / copySize) * 100) + "% (" + formatSize(copiedSize) + ", " + copiedFiles + " files)";
    process.stdout.cursorTo(23, 10 + 6);
    process.stdout.write(text + " ".repeat(process.stdout.columns - text.length - 23));

    let perc = Math.round((currentCopiedSize / currentFileSize) * 100);

    if (isNaN(perc)) {
        text = "-";
    } else {
        text = perc + "% (" + formatSize(currentCopiedSize) + ", " + formatETA((currentFileSize - currentCopiedSize) / speed) + ")";
    }

    process.stdout.cursorTo(23, 11 + 6);
    process.stdout.write(text + " ".repeat(process.stdout.columns - text.length - 23));

    text = formatETA((copySize - copiedSize) / speed) + " (" + formatSize(speed) + "/s)";
    if (text.length > process.stdout.columns - 23) text = text.substring(0, process.stdout.columns - 24) + "…";
    process.stdout.cursorTo(23, 12 + 6);
    process.stdout.write(text + " ".repeat(process.stdout.columns - text.length - 23));

    text = path.resolve(currentFile);
    if (text.length > process.stdout.columns - 23) text = text.substring(0, process.stdout.columns - 24) + "…";
    process.stdout.cursorTo(23, 13 + 6);
    process.stdout.write(text + " ".repeat(process.stdout.columns - text.length - 23));
}

function copyFile(src, out) {
    return new Promise((res) => {
        currentFileSize = 0;
        currentCopiedSize = 0;
        currentFile = src;

        if (fs.existsSync(src)) {
            fs.promises.lstat(src).then((stat) => {
                if (stat.isDirectory()) {
                    fs.mkdirSync(out);
                    copiedFiles++;
                    updateUI();
                    res();
                } else {
                    currentFileSize = fs.lstatSync(src).size;
                    const readStream = fs.createReadStream(src);
                    const writeStream = fs.createWriteStream(out);

                    readStream.on('data', function(chunk) {
                        writeStream.write(chunk);
                        copiedSize += chunk.length;
                        currentCopiedSize += chunk.length;
                        updateUI();
                    });

                    readStream.on('end', function() {
                        readStream.close();
                        writeStream.close();
                        res();
                    });
                }
            }).catch(() => {
                copiedFiles++;
                updateUI();
                res();
            });
        } else {
            copiedFiles++;
            updateUI();
            res();
        }
    });
}

function calculateSizeChange(size) {
    let sign = size > 0 ? "+" : (size < 0 ? "-" : "");
    let value = Math.abs(size);

    if (size === 0) return "No change";

    if (value > 1024) {
        if (value > 1024**2) {
            if (value > 1024**3) {
                if (value > 1024**4) {
                    return sign + (value / 1024**4).toFixed(2) + " TiB";
                } else {
                    return sign + (value / 1024**3).toFixed(2) + " GiB";
                }
            } else {
                return sign + (value / 1024**2).toFixed(2) + " MiB";
            }
        } else {
            return sign + (value / 1024).toFixed(2) + " KiB";
        }
    } else {
        return sign + value + " B";
    }
}

async function collectFiles(directory, show, text) {
    try {
        fs.readdirSync(directory);
    } catch (e) {
        return;
    }

    for (let file of fs.readdirSync(directory)) {
        let stat = await fs.promises.lstat(directory + "/" + file);
        if (!stat.isDirectory() && !stat.isFile()) continue;
        currentCollectionSize += stat.size;

        if (ignore.includes(show + "/" + file) || file === ".DS_Store") continue;

        list.push({
            name: show + "/" + file,
            directory: stat.isDirectory()
        });

        process.stdout.clearLine(null);
        process.stdout.cursorTo(0);
        process.stdout.write("┣ " + text + " " + list.length + " (" + formatSize(currentCollectionSize) + ")");

        if (stat.isDirectory()) {
            await collectFiles(directory + "/" + file, show + "/" + file, text);
        }
    }
}

let self = () => {
    setInterval(() => {
        absoluteSpeed = copiedSize - copiedSizeBefore;
        copiedSizeBefore = copiedSize;

        speeds.unshift(absoluteSpeed);
        speeds = speeds.splice(0, 600);
        speed = speeds.reduce((a, b) => a + b) / speeds.length;

        if (copying) updateUI();
    }, 1000);

    let start = new Date().getTime();

    console.log("backup v1.0.0");
    console.log("(c) Equestria.dev Developers\n");

    let source = process.argv[2];
    let target = process.argv[3];

    if (!source || !target) {
        console.log("Usage: pt backup <source> <target>");
        process.exit(2);
    }

    source = path.resolve(source);
    target = path.resolve(target);

    if (!fs.existsSync(source)) {
        console.log("backup: " + source + ": No such file or directory");
        process.exit(2);
    }

    if (!fs.existsSync(target)) {
        console.log("backup: " + target + ": No such file or directory");
        process.exit(2);
    }

    if (!fs.lstatSync(source).isDirectory()) {
        console.log("backup: " + source + ": Not a directory");
        process.exit(2);
    }

    if (!fs.lstatSync(target).isDirectory()) {
        console.log("backup: " + target + ": Not a directory");
        process.exit(2);
    }

    console.clear();
    console.log("┃ " + chalk.gray("Collect files from source"));
    console.log("┃ " + chalk.gray("Collect files from target"));
    console.log("┃ " + chalk.gray("Detect deleted files"));
    console.log("┃ " + chalk.gray("Analyse directory"));
    console.log("┃ " + chalk.gray("Copy updated files"));
    console.log("┃ " + chalk.gray("Delete removed files"));

    process.stdout.moveCursor(0, -6);

    let sourceFiles = [];
    let targetFiles = [];
    let toDelete = [];
    let toCopy = [];
    let sizeChange = 0;

    currentCollectionSize = 0;
    collectFiles(source, ".", "Collecting files from source...").then(() => {
        sourceFiles = list;
        list = [];

        process.stdout.cursorTo(0);
        process.stdout.clearLine(null);
        process.stdout.write("┃ " + chalk.green("Collected files from source"));
        process.stdout.moveCursor(0, 1);

        currentCollectionSize = 0;
        collectFiles(target, ".", "Collecting files from target...").then(async () => {
            targetFiles = list;
            list = [];

            process.stdout.cursorTo(0);
            process.stdout.clearLine(null);
            process.stdout.write("┃ " + chalk.green("Collected files from target"));
            process.stdout.moveCursor(0, 1);

            let index = 0;
            let lastPercentage = 0;
            let lastPercentageDuration = 0;
            let lastPercentageStart = new Date().getTime();

            for (let file of targetFiles) {
                let name = file.name;

                if (!sourceFiles.map(i => i.name).includes(name)) {
                    sizeChange -= fs.lstatSync(target + "/" + name).size;
                    toDelete.push(name);
                }

                index++;

                let percentage = Math.round((index / sourceFiles.length) * 100);
                if (percentage !== lastPercentage) {
                    lastPercentageDuration = new Date().getTime() - lastPercentageStart;
                    lastPercentageStart = new Date().getTime();
                    lastPercentage = percentage;
                }

                process.stdout.clearLine(null);
                process.stdout.cursorTo(0);

                if (lastPercentageDuration > 0) {
                    process.stdout.write("┣ Detecting deleted files... " + percentage + "%, " + formatETA(Math.round(lastPercentageDuration / 1000) * (100 - percentage)));
                } else {
                    process.stdout.write("┣ Detecting deleted files... " + percentage + "%");
                }
            }

            process.stdout.cursorTo(0);
            process.stdout.clearLine(null);
            process.stdout.write("┃ " + chalk.green("Detected deleted files"));
            process.stdout.moveCursor(0, 1);

            let index2 = 0;
            let lastPercentage2 = 0;
            let lastPercentageDuration2 = 0;
            let lastPercentageStart2 = new Date().getTime();

            for (let file of sourceFiles) {
                let name = file.name;

                if (fs.existsSync(source + "/" + name)) {
                    if (targetFiles.map(i => i.name).includes(name)) {
                        if (!(fs.lstatSync(source + "/" + name).mtimeMs <= fs.lstatSync(target + "/" + name).mtimeMs)) {
                            sizeChange += fs.lstatSync(source + "/" + name).size - fs.lstatSync(target + "/" + name).size;
                            copySize += fs.lstatSync(source + "/" + name).isDirectory() ? 0 : fs.lstatSync(source + "/" + name).size;
                            toCopy.push(name);
                        }
                    } else {
                        sizeChange += fs.lstatSync(source + "/" + name).size;
                        copySize += fs.lstatSync(source + "/" + name).isDirectory() ? 0 : fs.lstatSync(source + "/" + name).size;
                        toCopy.push(name);
                    }
                }

                index2++;

                let percentage = Math.round((index2 / sourceFiles.length) * 100);
                if (percentage !== lastPercentage2) {
                    lastPercentageDuration2 = new Date().getTime() - lastPercentageStart2;
                    lastPercentageStart2 = new Date().getTime();
                    lastPercentage2 = percentage;
                }

                process.stdout.clearLine(null);
                process.stdout.cursorTo(0);

                if (lastPercentageDuration > 0) {
                    process.stdout.write("┣ Analysing directory... " + percentage + "%, " + formatETA(Math.round(lastPercentageDuration / 1000) * (100 - percentage)));
                } else {
                    process.stdout.write("┣ Analysing directory... " + percentage + "%");
                }
            }

            process.stdout.cursorTo(0);
            process.stdout.clearLine(null);
            process.stdout.write("┃ " + chalk.green("Analysed directory"));
            process.stdout.moveCursor(0, 1);

            process.stdout.cursorTo(0, 4);
            process.stdout.clearLine(null);
            process.stdout.write("┣ Copying updated files...");
            process.stdout.cursorTo(0, 6);

            console.log(chalk.bold.cyan("\n══════ OVERVIEW ══════"));
            console.log(chalk.yellowBright("        Copying from:") + "  " + source);
            console.log(chalk.yellowBright("          Copying to:") + "  " + target);
            console.log(chalk.yellowBright("         Total files:") + "  " + sourceFiles.length);
            console.log(chalk.yellowBright("  Files to be copied:") + "  " + toCopy.length);
            console.log(chalk.yellowBright(" Files to be deleted:") + "  " + toDelete.length);
            console.log(chalk.yellowBright("Expected size change:") + "  " + calculateSizeChange(sizeChange));

            console.log(chalk.bold.cyan("\n══════ PROGRESS ══════"));
            console.log(chalk.yellowBright("    Overall progress:") + "  0% (0 B, 0 files)");
            console.log(chalk.yellowBright("        Current file:") + "  0% (0 B, 0 seconds)");
            console.log(chalk.yellowBright("      Time remaining:") + "  -");
            console.log(chalk.yellowBright("        Current file:") + "  -");

            updateUI();
            copying = true;

            for (let file of toCopy) {
                await copyFile(source + "/" + file, target + "/" + file);
            }

            for (let i = 7; i < process.stdout.rows; i++) {
                process.stdout.cursorTo(0, i);
                process.stdout.clearLine(null);
            }

            copying = false;

            process.stdout.cursorTo(0, 4);
            process.stdout.clearLine(null);
            process.stdout.write("┃ " + chalk.green("Copied files"));
            process.stdout.moveCursor(0, 1);

            process.stdout.cursorTo(0, 5);
            process.stdout.clearLine(null);
            process.stdout.write("┣ Deleting removed files...");

            let index3 = 0;

            for (let file of toDelete.sort((a, b) => {
                return b.length - a.length;
            })) {
                if (fs.existsSync(target + "/" + file)) {
                    fs.rmSync(target + "/" + file, { recursive: true });
                }

                index3++;

                process.stdout.clearLine(null);
                process.stdout.cursorTo(0);
                process.stdout.write("┣ Deleting removed files... " + Math.round((index3 / toDelete.length) * 100) + "%");
            }

            console.clear();
            console.log("Completed backup in " + formatETA(Math.round((new Date().getTime() - start) / 1000)));
            process.exit(0);
        });
    });
};

module.exports = self;