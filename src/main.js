const { crawlPage } = require("./crawl.js");
const { printReport } = require("./report.js");

async function main() {
  try {
    if (process.argv.length !== 3) {
      console.log("Usage: node main.js <website_url>");
      process.exit(1);
    }

    const baseURL = process.argv[2];
    console.log(`Starting crawl of ${baseURL}`);

    const pages = await crawlPage(baseURL, baseURL, {});
    printReport(pages);
  } catch (error) {
    console.error(error.message);
  }
}

main();
