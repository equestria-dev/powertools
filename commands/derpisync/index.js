const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

function sleep(ms) {
    return new Promise((res) => {
        setTimeout(res, ms);
    });
}

function timeToString(time) {
    if (!isNaN(parseInt(time))) {
        time = new Date(time).getTime();
    }

    let periods = ["second", "minute", "hour", "day", "week", "month", "year", "age"];

    let lengths = ["60", "60", "24", "7", "4.35", "12", "100"];

    let now = new Date().getTime();

    let difference = time / 1000;
    let period;

    let j;

    for (j = 0; difference >= lengths[j] && j < lengths.length - 1; j++) {
        difference /= lengths[j];
    }

    difference = Math.round(difference);

    period = periods[j];

    return `${difference} ${period}${difference > 1 ? "s" : ""}`;
}

module.exports = () => {
    console.log("Updating a Prisbeam database is now done directly inside of Prisbeam. Please open Prisbeam, load your current database, and go to Options > Update database from Derpibooru.");
    process.exit(1);

    function updateScreen() {
        let fetchEta = (totalPages - totalPageNumber) * (times.reduce((a, b) => a + b, 0) / times.length);
        let str = "Fetching: " + Math.round((totalPageNumber / totalPages) * 100) + "% (" + totalPageNumber + "/" + totalPages + ") complete" + (times.length > 10 ? ", " + timeToString(fetchEta) : "") + " (" + totalPrelistFull.length + ")";

        if (global.images > 0) {
            let eta = (totalImages - times2.length) * (times2.reduce((a, b) => a + b, 0) / times2.length) + (fetchEta > 1000 ? fetchEta : 0);

            if (doneFetching) {
                str = "Downloading: " + Math.round((images / totalImages) * 100) + "% (" + images + "/" + totalImages + ") complete" + (times2.length > 10 && eta > 1000 ? ", " + timeToString(eta) : "") + " (" + lastImage['id'].toString() + ")";
            } else {
                str += " | Downloading: " + Math.round((images / totalImages) * 100) + "% (" + images + "/" + totalImages + ") complete" + (times2.length > 10 && eta > 1000 ? ", " + timeToString(eta) : "") + " (" + lastImage['id'].toString() + ")";
            }
        }

        process.stdout.cursorTo(0);
        str = str.substring(0, process.stdout.columns - 1);
        process.stdout.write(str + " ".repeat(process.stdout.columns - str.length - 1));
    }

    async function downloadNextImage() {
        let image = totalPrelist[0];
        global.lastImage = image;
        let start = new Date();

        let path1 = (image['sha512_hash'] ?? image['orig_sha512_hash'] ?? "0000000").substring(0, 1);
        let path2 = (image['sha512_hash'] ?? image['orig_sha512_hash'] ?? "0000000").substring(0, 2);

        if (!fs.existsSync("./images/" + path1)) fs.mkdirSync("./images/" + path1);
        if (!fs.existsSync("./images/" + path1 + "/" + path2)) fs.mkdirSync("./images/" + path1 + "/" + path2);
        if (!fs.existsSync("./thumbnails/" + path1)) fs.mkdirSync("./thumbnails/" + path1);
        if (!fs.existsSync("./thumbnails/" + path1 + "/" + path2)) fs.mkdirSync("./thumbnails/" + path1 + "/" + path2);

        if (!fs.existsSync("./images/" + path1 + "/" + path2 + "/" + image['id'] + path.extname(image['view_url'])) || !fs.existsSync("./thumbnails/" + path1 + "/" + path2 + "/" + image['id'] + path.extname(image['representations']['thumb']))) {
            if (fs.existsSync("./images/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['view_url']))) fs.unlinkSync("./images/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['view_url']));
            if (fs.existsSync("./thumbnails/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['representations']['thumb']))) fs.unlinkSync("./thumbnails/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['representations']['thumb']));
            fs.writeFileSync("./images/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['view_url']), Buffer.from(await (await fetch(image['view_url'])).arrayBuffer()));
            fs.writeFileSync("./thumbnails/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['representations']['thumb']), Buffer.from(await (await fetch(image['representations']['thumb'])).arrayBuffer()));

            fs.renameSync("./thumbnails/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['representations']['thumb']), "./thumbnails/" + path1 + "/" + path2 + "/" + image['id'] + path.extname(image['representations']['thumb']));
            fs.renameSync("./images/" + path1 + "/" + path2 + "/." + image['id'] + path.extname(image['view_url']), "./images/" + path1 + "/" + path2 + "/" + image['id'] + path.extname(image['view_url']));
        }

        times2.push(new Date().getTime() - start);
        totalPrelist.shift();
        global.images++;

        updateScreen();
        downloadLoop();
    }

    function downloadLoop() {
        setTimeout(async () => {
            if (typeof totalPrelist === "undefined") {
                downloadLoop();
                return;
            }

            if (totalPrelist[0]) {
                await downloadNextImage();
            } else if (totalPrelistFull.length > 0 && global.images >= totalPrelistFull.length && doneFetching) {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write("All done!\n");
                process.exit(0);
            } else {
                downloadLoop();
            }
        });
    }

    (async () => {
        global.doneFetching = false;
        downloadLoop();

        if (!fs.existsSync(os.homedir() + "/.derpisync")) {
            console.log("Please add your Derpibooru API key to " + os.homedir() + "/.derpisync and try again.");
            return;
        }

        if (!fs.existsSync("./thumbnails")) fs.mkdirSync("./thumbnails");
        if (!fs.existsSync("./images")) fs.mkdirSync("./images");

        let username = fs.readFileSync(os.homedir() + "/.derpisync").toString().trim();
        let total1 = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&key=" + username + "&page=1&per_page=1&q=" + encodeURIComponent("my:faves"))).json())['total'];
        let total2 = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&key=" + username + "&page=1&per_page=1&q=" + encodeURIComponent("my:upvotes"))).json())['total'];
        let total3 = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&key=" + username + "&page=1&per_page=1&q=" + encodeURIComponent("my:downvotes"))).json())['total'];
        let total4 = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&key=" + username + "&page=1&per_page=1&q=" + encodeURIComponent("my:watched"))).json())['total'];
        let total5 = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&key=" + username + "&page=1&per_page=1&q=" + encodeURIComponent("my:uploads"))).json())['total'];
        let pages1 = Math.ceil(total1 / 50);
        let pages2 = Math.ceil(total2 / 50);
        let pages3 = Math.ceil(total3 / 50);
        let pages4 = Math.ceil(total4 / 50);
        let pages5 = Math.ceil(total5 / 50);

        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine();
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine();
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine();

        let types = [];

        if (!process.argv[2] || process.argv[2] === "faves") {
            types.push({
                query: "my:faves",
                name: "faved",
                pages: pages1,
                total: total1
            });
        }

        if (!process.argv[2] || process.argv[2] === "upvotes") {
            types.push({
                query: "my:upvotes",
                name: "upvotes",
                pages: pages2,
                total: total2
            });
        }

        if (!process.argv[2] || process.argv[2] === "downvotes") {
            types.push({
                query: "my:downvotes",
                name: "downvotes",
                pages: pages3,
                total: total3
            });
        }

        if (!process.argv[2] || process.argv[2] === "watched") {
            types.push({
                query: "my:watched",
                name: "watched",
                pages: pages4,
                total: total4
            });
        }

        if (!process.argv[2] || process.argv[2] === "uploads") {
            types.push({
                query: "my:uploads",
                name: "uploads",
                pages: pages5,
                total: total5
            });
        }

        let prelists = {};
        global.totalPrelist = [];
        global.totalPrelistFull = [];
        global.times = [];
        global.times2 = [];
        global.totalPages = types.map(i => i['pages']).reduce((a, b) => a + b);
        global.totalImages = types.map(i => i['total']).reduce((a, b) => a + b);
        global.totalPageNumber = 0;
        global.images = 0;

        for (let type of types) {
            if (type['total'] > 150000) {
                console.log("");
                console.log("Warning: There are over 150000 images to save in " + type.name + ", so only the first 150000 " + type.name + " will be saved. Please remove " + (type['total'] - 150000) + " images and try again.");

                type["pages"] = 3000;
                type["total"] = 150000;

                global.totalPages = types.map(i => i['pages']).reduce((a, b) => a + b);
                global.totalImages = types.map(i => i['total']).reduce((a, b) => a + b);
            }
        }

        console.log("");
        console.log(totalImages + " images to download from your Derpibooru account, part of " + totalPages + " pages");

        for (let type of types) {
            let prelist = [];
            let pages = type.pages;

            for (let pageNumber = 1; pageNumber <= pages + 1; pageNumber++) {
                let start = new Date();
                let tryFetch = true;
                let page;

                while (tryFetch) {
                    try {
                        page = await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&key=" + username + "&page=" + pageNumber + "&per_page=50&q=" + encodeURIComponent(type.query))).json();
                        page['images'] = page['images'].map((image) => {
                            if (image['representations']['thumb'].endsWith(".mp4") || image['representations']['thumb'].endsWith(".webm")) {
                                image['representations']['thumb'] = image['representations']['thumb'].substring(0, image['representations']['thumb'].length - path.extname(image['representations']['thumb']).length) + ".gif";
                            }

                            return image;
                        });

                        tryFetch = false;
                    } catch (e) {
                        await sleep(1000);
                    }
                }

                prelist.push(...page['images']);
                totalPrelist.push(...page['images']);
                totalPrelistFull.push(...page['images']);
                await sleep(1000);
                times.push(new Date().getTime() - start);

                updateScreen();

                global.totalPageNumber++;
            }

            fs.writeFileSync("./" + type.name + ".pdsdb", zlib.deflateRawSync(JSON.stringify(prelist)));
            prelists[type.name] = prelist;
        }

        global.doneFetching = true;
    })();
}