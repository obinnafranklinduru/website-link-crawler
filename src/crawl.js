const axios = require("axios");
const Bottleneck = require("bottleneck/es5");
const normalizeURL = require("normalizeurl");
const { JSDOM } = require("jsdom");
const printError = require("./utils/errorhandler");

// Set up rate limiter to control crawling rate
const limiter = new Bottleneck({
  maxConcurrent: 15, // Maximum number of concurrent requests
  minTime: 333, // Minimum time between each request in milliseconds
});

/**
 * Recursively crawl a web page and its linked pages
 * @param {string} baseURL - The base URL of the website being crawled
 * @param {string} currentURL - The URL of the current page being crawled
 * @param {Object} pages - Object containing crawled pages and their occurrence counts
 * @returns {Promise<Object>} - Promise resolving to the updated pages object after crawling
 */
async function crawlPage(baseURL, currentURL, pages) {
  try {
    // Parse current and base URLs
    const currentUrlObj = new URL(currentURL);
    const baseUrlObj = new URL(baseURL);

    // Check if current URL belongs to the same hostname as base URL
    if (currentUrlObj.hostname !== baseUrlObj.hostname) return pages;

    // Normalize current URL
    const normalizedURL = normalizeURL(currentUrlObj.href);

    // Increment page count if URL already exists in pages object
    if (typeof pages[normalizedURL] !== "undefined") {
      pages[normalizedURL]++;
      return pages;
    }

    // Initialize page count if URL is encountered for the first time
    pages[normalizedURL] = 1;

    // Log crawling process
    console.log(`Crawling ${normalizedURL}`);

    // Send HTTP request to fetch the page content
    const response = await axios.get(normalizedURL);

    // Handle different HTTP response statuses
    if (response.status === 404) return pages;

    if (response.status > 399) {
      console.log(`Got HTTP error, status code: ${response.status}`);
      return pages;
    }

    // Check if response content type is HTML
    if (
      !response.headers["content-type"] ||
      !response.headers["content-type"].includes("text/html")
    ) {
      console.log(`Skipping non-HTML content: ${currentURL}`);
      return pages;
    }

    // Extract URLs from HTML content of the page
    const htmlBody = response.data;
    const nextURLs = getURLsFromHTML(htmlBody, baseURL);

    // Crawl linked pages in parallel with rate limiting
    for (const nextURL of nextURLs) {
      pages = await limiter.schedule(() => crawlPage(baseURL, nextURL, pages));
    }

    return pages;
  } catch (error) {
    // Handle and log errors during crawling
    printError(error, currentURL);
  }
}

/**
 * Extract URLs from HTML content
 * @param {string} htmlBody - HTML content of the page
 * @param {string} baseURL - The base URL of the website
 * @returns {Array<string>} - Array of extracted URLs
 */
function getURLsFromHTML(htmlBody, baseURL) {
  const urls = [];
  const dom = new JSDOM(htmlBody);
  const aElements = dom.window.document.querySelectorAll("a");

  // Iterate over anchor elements and extract URLs
  for (const aElement of aElements) {
    const href = aElement.href;

    // Skip empty or invalid URLs
    if (!href || href.trim() === "") {
      continue;
    }

    try {
      // Resolve relative URLs to absolute URLs
      const absoluteURL = new URL(href, baseURL).href;
      urls.push(absoluteURL);
    } catch (err) {
      console.log(`${err.message}: ${href}`);
    }
  }

  return urls;
}

module.exports = {
  crawlPage,
  getURLsFromHTML,
};
