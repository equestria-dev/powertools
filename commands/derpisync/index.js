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
    (async () => {
        let listFull = [];

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

        let images = 0;
        let types = [
            {
                query: "my:faves",
                name: "favorites",
                pages: pages1,
                total: total1
            },
            {
                query: "my:upvotes",
                name: "upvotes",
                pages: pages1,
                total: total1
            },
            {
                query: "my:downvotes",
                name: "downvotes",
                pages: pages1,
                total: total1
            },
            {
                query: "my:watched",
                name: "watched",
                pages: pages1,
                total: total1
            },
            {
                query: "my:uploads",
                name: "uploads",
                pages: pages1,
                total: total1
            }
        ];

        let prelists = {};
        let totalPrelist = [];
        let times = [];
        let totalPages = pages1 + pages2 + pages3 + pages4 + pages5;
        let totalImages = total1 + total2 + total3 + total4 + total5;
        let totalPageNumber = 0;

        if (total1 + total2 + total3 + total4 + total5 > 150000) {
            console.log("");
            console.log("Error: There are over 150000 images to save, which is unsupported. Please remove " + ((total1 + total2 + total3 + total4 + total5) - 150000) + " images and try again.");
            return;
        } else {
            console.log("");
            console.log((total1 + total2 + total3 + total4 + total5) + " images to download from your Derpibooru account, part of " + (pages1 + pages2 + pages3 + pages4 + pages5) + " pages");
        }

        for (let type of types) {
            let prelist = [];
            let pages = type.pages;

            for (let pageNumber = 1; pageNumber <= pages + 1; pageNumber++) {
                let start = new Date();

                let str = "Fetching images list: " + Math.round((totalPageNumber / totalPages) * 100) + "% complete" + (times.length > 10 ? ", " + timeToString((totalPages - totalPageNumber) * (times.reduce((a, b) => a + b) / times.length)) : "");
                process.stdout.cursorTo(0);
                process.stdout.write(str + " ".repeat(process.stdout.columns - str.length - 1));

                let page = await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&key=" + username + "&page=" + pageNumber + "&per_page=50&q=" + encodeURIComponent(type.query))).json();
                prelist.push(...page['images']);
                await sleep(700);
                times.push(new Date().getTime() - start);

                totalPageNumber++;
            }

            totalPrelist.push(...prelist);
            prelists[type.name] = prelist;
        }

        times = [];

        for (let type of types) {
            let list = [];
            let prelist = prelists[type.name];

            for (let image of prelist) {
                let start = new Date();

                let str = "Downloading images: " + Math.round((images / totalPrelist.length) * 100) + "% complete" + (times.length > 10 ? ", " + timeToString((totalPrelist.length - times.length) * (times.reduce((a, b) => a + b) / times.length)) : "") + " (" + image['id'].toString() + ")";
                process.stdout.cursorTo(0);
                process.stdout.write(str + " ".repeat(process.stdout.columns - str.length - 1));

                if (image['representations']['thumb'].endsWith(".mp4") || image['representations']['thumb'].endsWith(".webm")) {
                    image['representations']['thumb'] = image['representations']['thumb'].substring(0, image['representations']['thumb'].length - path.extname(image['representations']['thumb']).length) + ".gif";
                }

                list.push(image);

                let path1 = image['sha512_hash'].substring(0, 1);
                let path2 = image['sha512_hash'].substring(0, 2);

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

                times.push(new Date().getTime() - start);
                images++;
            }

            for (let item of list) {
                if (!listFull.map(i => i.id).includes(item.id)) {
                    listFull.push(item);
                }
            }

            fs.writeFileSync("./" + type.name + ".pdsdb", zlib.deflateRawSync(JSON.stringify(list)));
        }

        fs.writeFileSync("./list.pdsdb", zlib.deflateRawSync(JSON.stringify(listFull)));

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write("All done!\n");
    })();
}