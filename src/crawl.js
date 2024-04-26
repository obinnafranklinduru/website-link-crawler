const { JSDOM } = require("jsdom");
const axios = require("axios");

async function crawlPage(baseURL, currentURL, pages) {
  const currentUrlObj = new URL(currentURL);
  const baseUrlObj = new URL(baseURL);
  if (currentUrlObj.hostname !== baseUrlObj.hostname) {
    return pages;
  }

  const normalizedURL = normalizeURL(currentURL);
  if (pages[normalizedURL] > 0) {
    pages[normalizedURL]++;
    return pages;
  }

  pages[normalizedURL] = 1;

  console.log(`crawling ${currentURL}`);
  let htmlBody = "";
  try {
    const response = await axios.get(currentURL);

    if (response.status > 399) {
      console.log(
        `error in fetch with status code: ${response.status}and message: ${response.statusText} on page:${currentURL}`
      );
      return pages;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType.includes("text/html")) {
      console.log(
        `error in fetch with content type: ${contentType} on page:${currentURL}`
      );
      return pages;
    }

    htmlBody = await response.data;
  } catch (error) {
    console.log(error.message);
  }

  const nextURLs = getURLsFromHTML(htmlBody, currentURL);

  nextURLs.forEach(async (nextURL) => {
    pages = await crawlPage(baseURL, nextURL, pages);
  });

  return pages;
}

function getURLsFromHTML(htmlBody, baseURL) {
  const urls = [];
  const dom = new JSDOM(htmlBody);
  dom.window.document.querySelectorAll("a").forEach((linkElement) => {
    if (linkElement.href.slice(0, 1) === "/") {
      try {
        const urlObj = new URL(`${baseURL}${linkElement.href}`);
        urls.push(urlObj.href);
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        const urlObj = new URL(linkElement.href);
        urls.push(urlObj.href);
      } catch (error) {
        console.log(error);
      }
    }
  });

  return urls;
}

function normalizeURL(url) {
  const urlObj = new URL(url);
  let fullPath = `${urlObj.host}${urlObj.pathname}`;
  if (fullPath.length > 0 && fullPath.slice(-1) === "/") {
    fullPath = fullPath.slice(0, -1);
  }
  return fullPath;
}

module.exports = {
  normalizeURL,
  getURLsFromHTML,
  crawlPage,
};
