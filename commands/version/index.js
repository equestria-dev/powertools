module.exports = () => {
    console.log("Equestria.dev Power Tools");
    console.log("  Version " + require('../../package.json').version + ", build " + BuildInfo.BUILD);
    console.log("  Built against NodeJS " + BuildInfo.VERSION + " on " + BuildInfo.SOURCE_USER);
    console.log("  Source: " + BuildInfo.SOURCE_DIR);
    console.log("  Build Date: " + new Date(BuildInfo.DATE).toISOString());
}