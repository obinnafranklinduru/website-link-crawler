const { crawlPage } = require("./crawl.js");

async function main() {
  try {
    if (process.argv.length < 3) {
      console.log("no website provided");
      process.exit(1);
    }

    if (process.argv.length > 3) {
      console.log("too many arguments provided");
      process.exit(1);
    }

    const baseURL = process.argv[2];

    console.log(`starting crawl of ${baseURL}`);
    const pages = await crawlPage(baseURL, baseURL, {});

    console.log(pages);
  } catch (error) {
    console.log(error.message);
  }
}

main();
