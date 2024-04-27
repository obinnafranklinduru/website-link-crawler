const axios = require("axios");
const cheerio = require("cheerio");
const url = require("url");

/**
 * Extract valid URLs from the HTML content
 * @param {string} html - HTML content of the page
 * @param {string} baseUrl - Base URL of the website
 * @returns {Array<string>} - Array of valid URLs
 */
function extractValidUrls(html, baseUrl) {
  const $ = cheerio.load(html);
  const validUrls = [];

  $("a").each((index, element) => {
    let href = $(element).attr("href");
    if (
      href &&
      href.trim() !== "" &&
      !href.startsWith("#") &&
      !href.startsWith("javascript:")
    ) {
      if (!href.startsWith("http")) {
        href = url.resolve(baseUrl, href);
      }
      validUrls.push(href);
    }
  });

  return validUrls;
}

/**
 * Crawl a URL and retrieve its status and valid URLs
 * @param {string} url - URL to crawl
 * @returns {Promise<Object>} - Promise resolving to an object containing URL, status, and valid URLs
 */
async function crawl(url) {
  try {
    const response = await axios.get(url);
    return {
      url,
      status: response.status,
      validUrls: extractValidUrls(response.data, url),
    };
  } catch (error) {
    return {
      url,
      error: error.message,
    };
  }
}

/**
 * Recursively crawl all valid URLs starting from a given URL
 * @param {string} startUrl - URL to start crawling from
 * @returns {Promise<Array<Object>>} - Promise resolving to an array of crawl report objects
 */
async function crawlAll(startUrl) {
  const visitedUrls = new Set();
  const queue = [startUrl];
  const report = [];

  while (queue.length > 0) {
    const currentUrl = queue.shift();

    if (!visitedUrls.has(currentUrl)) {
      visitedUrls.add(currentUrl);
      console.log(`Crawling ${currentUrl}`);
      const result = await crawl(currentUrl);
      report.push(result);

      if (result.validUrls) {
        result.validUrls.forEach((validUrl) => {
          if (!visitedUrls.has(validUrl)) {
            queue.push(validUrl);
          }
        });
      }
    }
  }

  return report;
}

/**
 * Start crawling from a provided URL and print the crawl report
 * @param {string} startUrl - URL to start crawling from
 */
async function startCrawling(startUrl) {
  console.log(`Starting crawl of ${startUrl}`);
  const report = await crawlAll(startUrl);
  console.log("Crawl completed. Report:");
  console.log(report);
}

// Extract start URL from command line arguments and initiate crawling
const startUrl = process.argv[2];
startCrawling(startUrl);
