const axios = require("axios");
const Bottleneck = require("bottleneck/es5");
const normalizeURL = require("normalizeurl");
const { JSDOM } = require("jsdom");
const validUrl = require("valid-url");
const CrawlerError = require("./utils/errorhandler");

const limiter = new Bottleneck({
  maxConcurrent: 7,
  minTime: 500,
});

// Set a maximum number of pages to crawl
const MAX_PAGES_TO_CRAWL = 1000;

async function crawlPage(baseURL, currentURL, pages, visitedPages) {
  visitedPages = visitedPages || new Set();
  const currentUrlObj = new URL(currentURL);
  const baseUrlObj = new URL(baseURL);

  if (currentUrlObj.hostname !== baseUrlObj.hostname) {
    return pages;
  }

  const normalizedURL = normalizeURL(currentURL);

  if (visitedPages.has(normalizedURL)) {
    console.log(`Already visited: ${currentURL}`);
    return pages;
  }

  visitedPages.add(normalizedURL);

  if (Object.keys(pages).length >= MAX_PAGES_TO_CRAWL) {
    console.log(
      `Maximum number of pages (${MAX_PAGES_TO_CRAWL}) reached. Stopping crawl.`
    );
    return pages;
  }

  console.log(`Crawling ${currentURL}`);

  try {
    const response = await axios.get(currentURL);

    if (
      !response.headers["content-type"] ||
      !response.headers["content-type"].includes("text/html")
    ) {
      console.log(`Skipping non-HTML content: ${currentURL}`);
      return pages;
    }

    const htmlBody = response.data;
    const nextURLs = getURLsFromHTML(htmlBody, baseURL);
    console.log(`Found ${nextURLs.length} next URLs:`, nextURLs);

    const validNextURLs = nextURLs.filter((url) => validUrl.isUri(url));
    console.log(
      `Found ${validNextURLs.length} valid next URLs:`,
      validNextURLs
    );

    const crawlPromises = validNextURLs.map((nextURL) => {
      return limiter.schedule(
        async () => await crawlPage(baseURL, nextURL, pages, visitedPages)
      );
    });

    const newPages = await Promise.all(crawlPromises);

    // Merge all maps of pages into one
    const mergedPages = newPages.reduce((acc, page) => {
      for (const [key, value] of Object.entries(page)) {
        acc[key] = value;
      }
      return acc;
    }, {});

    Object.assign(pages, mergedPages); // Merge new pages into the original 'pages' object
  } catch (error) {
    if (error.response) {
      console.error(
        `Error fetching ${currentURL}: ${error.response.status} ${error.response.statusText}`
      );
    } else if (error instanceof CrawlerError) {
      console.error(`[CrawlerError] ${error.message} (URL: ${error.url})`);
    } else {
      console.error(`Unexpected error: ${error.message} (URL: ${currentURL})`);
    }
  }

  console.log(`Crawled ${Object.keys(pages).length} pages`);
  return pages;
}

function getURLsFromHTML(htmlBody, baseURL) {
  const urls = [];
  const dom = new JSDOM(htmlBody);
  const aElements = dom.window.document.querySelectorAll("a");

  for (const aElement of aElements) {
    const href = aElement.href;

    if (!href || href.trim() === "") {
      continue;
    }

    try {
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
