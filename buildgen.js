const os = require('os');
const fs = require('fs');
require('./build');

obj = {
    BUILD: BuildInfo.BUILD + 1,
    DATE: new Date(),
    SOURCE_USER: os.userInfo().username + "@" + os.hostname(),
    SOURCE_DIR: __dirname,
    VERSION: process.versions.node
}

fs.writeFileSync("./build.js", "global.BuildInfo = JSON.parse(`" + JSON.stringify(obj).replaceAll("`", "\\`") + "`);");