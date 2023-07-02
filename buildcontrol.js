const build = require('./build.json');
const crypto = require("crypto");
const fs = require("fs");
const data = {};

data.properties = build;
data.versions = {
    "linux-arm64": "https://cdn.equestria.dev/powertools/release-linux-arm64.bin",
    "linux-x64": "https://cdn.equestria.dev/powertools/release-linux-x64.bin",
    "darwin-arm64": "https://cdn.equestria.dev/powertools/release-darwin-arm64.bin",
}
data.control = {
    "linux-arm64": crypto.createHash("sha256").update(fs.readFileSync("./bin/linux/arm64/pt")).digest("base64"),
    "linux-x64": crypto.createHash("sha256").update(fs.readFileSync("./bin/linux/x64/pt")).digest("base64"),
    "darwin-arm64": crypto.createHash("sha256").update(fs.readFileSync("./bin/mac/arm64/pt")).digest("base64")
}

fs.writeFileSync("./build.json", JSON.stringify(data));