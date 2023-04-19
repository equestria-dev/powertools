const fetch = require('node-fetch');

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

module.exports = async (inUpdate) => {
    let response = null;

    try {
        console.log(inUpdate ? "Fetching update..." : "Checking for updates...");
        let update = await (await fetchWithTimeout("https://static.equestria.horse/powertools/build.json")).json();
        let latestBuild = update.properties.BUILD;
        let currentBuild = BuildInfo.BUILD;

        if (latestBuild > currentBuild) {
            if (!inUpdate) {
                console.log("An update to build " + latestBuild + " is available, run 'pt update' to install it.");
            }
            response = true;
        } else if (latestBuild < currentBuild) {
            console.log("Local version (" + currentBuild + ") is newer than the currently available version (" + latestBuild +  ").");
            response = false;
        } else {
            console.log("Power Tools is up to date.");
            response = false;
        }
    } catch (e) {
        console.log((inUpdate ? "Failed to fetch update: " : "Failed to check for updates: ") + e.message);
        console.log(e.stack);
    }

    if (!inUpdate) console.log("");
    return response;
}