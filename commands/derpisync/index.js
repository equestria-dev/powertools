const fs = require('fs');
const os = require('os');
const path = require('path');

function sleep(ms) {
    return new Promise((res) => {
        setTimeout(res, ms);
    });
}

module.exports = () => {
    (async () => {
        if (!fs.existsSync(os.homedir() + "/.derpisync")) {
            console.log("Please add your Derpibooru username to " + os.homedir() + "/.derpisync and try again.");
            return;
        }

        let username = fs.readFileSync(os.homedir() + "/.derpisync").toString().trim();
        let total = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&page=1&per_page=1&q=" + encodeURIComponent("faved_by:" + username))).json())['total'];
        let images = 0;
        let pages = Math.floor(total / 50);

        console.log(total + " images to download from " + username + ", part of " + pages + " pages");

        await sleep(500);

        for (let pageNumber = 1; pageNumber <= pages; pageNumber++) {
            console.log("Page " + pageNumber + "/" + pages);
            let page = await (await fetch("https://derpibooru.org/api/v1/json/search/images?filter_id=56027&page=" + pageNumber + "&per_page=50&q=" + encodeURIComponent("faved_by:" + username))).json();

            await sleep(500);

            for (let image of page['images']) {
                process.stdout.write(image['id'].toString());

                if (!fs.existsSync(image['id'] + path.extname(image['view_url']))) {
                    if (fs.existsSync("." + image['id'] + path.extname(image['view_url']))) fs.unlinkSync("." + image['id'] + path.extname(image['view_url']));
                    fs.writeFileSync("." + image['id'] + path.extname(image['view_url']), Buffer.from(await (await fetch(image['view_url'])).arrayBuffer()));
                    process.stdout.write(", updated");
                    fs.renameSync("." + image['id'] + path.extname(image['view_url']), image['id'] + path.extname(image['view_url']));
                } else {
                    process.stdout.write(", existing");
                }

                images++;
                process.stdout.write(", " + images + "/" + total + ", " + Math.round((images / total) * 100) + "%\n");
            }
        }
    })();
}