module.exports = () => {
    const readline = require('node:readline');
    const { stdin: input, stdout: output } = require('node:process');
    const fs = require('fs');
    const path = require('path');

    function prompt(text) {
        return new Promise((res) => {
            const rl = readline.createInterface({ input, output });

            rl.question(text, (answer) => {
                rl.close();
                res(answer);
            });
        });
    }

    function sleep(ms) {
        return new Promise((res) => {
            setTimeout(res, ms);
        });
    }

    (async () => {
        try {
            console.log("Loading application...");

            await fetch("https://google.com");
            console.log("");

            console.log("If you want the program to access restricted search results, you can enter your API key here. You can get it at https://derpibooru.org/registrations/edit. You can also leave this empty if you want public search results. Search terms starting with `my:` won't work in this case.");
            console.log("");
            let apiKey = (await prompt("Enter your Derpibooru API key: ")).trim();
            console.log("");

            if (apiKey === "") {
                console.log("WARNING: You have chosen not to provide an API key, you will only be able to access public search results.");
                console.log("");
            }

            console.log("------------------------------------------------\n");

            console.log("Now enter a Derpibooru search query. For example, if you want to save the images in your favorites, you use `my:faves`; if you want to save Twilight Sparkle images, you use `twilight sparkle`.");
            let query = "";
            console.log("");

            while (query === "") {
                query = (await prompt("Enter your Derpibooru search query: ")).trim();

                if (query === "") {
                    console.log("ERROR: The search query cannot be empty");
                }
            }

            console.log("");
            console.log("------------------------------------------------\n");
            process.stdout.write("Now downloading search results for: " + query + ", this may take a while. ");

            let amount = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?q=" + encodeURIComponent(query) + "&per_page=1&page=1&sf=first_seen_at&sd=desc&filter_id=56027&key=" + apiKey)).json())['total'];
            let pages = Math.floor(amount / 50);
            let list = [];

            for (let page = 1; page <= pages; page++) {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write("Now downloading search results for: " + query + ", this may take a while. " + Math.floor((page / pages) * 100) + "%, " + list.length + "/" + amount);

                let data = (await (await fetch("https://derpibooru.org/api/v1/json/search/images?q=" + encodeURIComponent(query) + "&per_page=50&page=" + page + "&sf=first_seen_at&sd=desc&filter_id=56027&key=" + apiKey)).json())['images'];
                list.push(...data);

                await sleep(500);
            }

            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write("Now downloading search results for: " + query + ", this may take a while. 100%, " + amount + "/" + amount);

            console.log("\nSaving data...");
            let id = new Date().getTime();

            fs.writeFileSync(require('os').homedir() + "/Derpibooru-" + id + ".json", JSON.stringify(list));
            fs.writeFileSync(require('os').homedir() + "/Derpibooru-" + id + ".txt", list.map(i => "https://derpibooru.org/images/" + i['id']).join("\n") + "\n");
            fs.writeFileSync(require('os').homedir() + "/Derpibooru-" + id + ".csv", "id\ttags\tscore\tmime_type\tsize\tcreated_at" + list.map(i => i['id'] + "\t" + i['tags'].join(", ") + "\t" + i['score'] + "\t" + i['mime_type'] + "\t" + i['size'] + "\t" + i['created_at']).join("\n") + "\n");

            console.log("");console.log("------------------------------------------------\n");
            console.log("The data was saved in the following files:");
            console.log("    * " + path.resolve(require('os').homedir() + "/derpilist-" + id + ".json") + "     [JSON computer data]");
            console.log("    * " + path.resolve(require('os').homedir() + "/derpilist-" + id + ".txt") + "      [text list of URLs]");
            console.log("    * " + path.resolve(require('os').homedir() + "/derpilist-" + id + ".csv") + "      [spreadsheet]");
            console.log("");
            console.log("Thank you!");
        } catch (e) {
            console.log("\n\n");
            console.log("----!!!!--------------------------------!!!!----\n");
            console.log("Sorry, an error occurred. Details are shown below:\n");
            console.log(e.stack);
        }
    })();
}