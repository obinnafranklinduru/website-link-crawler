const { crawlPage } = require("./crawl.js");
const { printReport } = require("./report.js");

/**
 * Main function to initiate website crawling and generate report
 */
async function main() {
  try {
    // Validate command line arguments
    if (process.argv.length !== 3) {
      console.log("Usage: node main.js <website_url>");
      process.exit(1);
    }

    // Extract base URL from command line arguments
    const baseURL = process.argv[2];
    console.log(`Starting crawl of ${baseURL}`);

    // Initiate crawling process and get pages object
    const pages = await crawlPage(baseURL, baseURL, {});

    // Generate and print report based on crawled pages
    printReport(pages);
  } catch (error) {
    // Handle and log any errors that occur during execution
    console.error(error.message);
  }
}

// Execute main function
main();
