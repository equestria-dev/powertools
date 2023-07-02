const fetch = require('node-fetch');
const os = require("os");
const child_process = require("child_process");
const fs = require('fs');
const crypto = require("crypto");

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

module.exports = async () => {
    let hasUpdates = await require('../../updater')(true);

    if (typeof hasUpdates === "boolean") {
        if (hasUpdates) {
            let update = await (await fetchWithTimeout("https://cdn.equestria.dev/powertools/build.json")).json();
            let platform = os.platform() + "-" + os.arch();

            if (update.versions[platform]) {
                let tmp = fs.mkdtempSync(os.tmpdir() + "/ptupdate-");

                console.log("Downloading Power Tools build " + update.properties.BUILD + "...");
                child_process.execSync("wget " + update.versions[platform] + " -O " + tmp + "/package.bin", { stdio: "inherit" });
                console.log("Verifying update...");

                let localControl = crypto.createHash("sha256").update(fs.readFileSync(tmp + "/package.bin")).digest("base64");
                if (localControl === update.control[platform]) {
                    console.log("Verifying the update can be installed...");

                    try {
                        fs.renameSync(process.argv[0], process.argv[0] + ".test");
                        fs.renameSync(process.argv[0] + ".test", process.argv[0]);
                    } catch (e) {
                        console.log("The update cannot be installed to " + process.argv[0] + ", make sure you have write access to this file and try again.");
                        return;
                    }

                    console.log("Installing update...");

                    try {
                        fs.renameSync(process.argv[0], process.argv[0] + ".old");
                        fs.copyFileSync(tmp + "/package.bin", process.argv[0]);
                        fs.chmodSync(process.argv[0], 0o755);
                    } catch (e) {
                        console.error(e);
                        console.log("Failed to install update, reverting changes...");

                        if (fs.existsSync(process.argv[0]) && fs.existsSync(process.argv[0] + ".old")) {
                            fs.rmSync(process.argv[0]);
                            fs.renameSync(process.argv[0] + ".old", process.argv[0]);
                        } else if (!fs.existsSync(process.argv[0]) && fs.existsSync(process.argv[0] + ".old")) {
                            fs.renameSync(process.argv[0] + ".old", process.argv[0]);
                        }

                        fs.chmodSync(process.argv[0], 0o755);
                        fs.rmSync(process.argv[0] + ".old");
                        return;
                    }

                    fs.rmSync(tmp + "/package.bin");
                    console.log("The update has been installed successfully.");
                    fs.rmSync(tmp + "/package.bin");
                } else {
                    console.log("Failed to verify update:\n    Expected: " + update.control[platform] + "\n    Found: " + localControl);
                }

                if (fs.existsSync(tmp + "/package.bin")) fs.rmSync(tmp + "/package.bin");
                if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true });
            } else {
                console.log("This update is not available for your platform (" + platform + ").");
            }
        }
    }
}