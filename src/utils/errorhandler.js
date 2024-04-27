class CrawlerError extends Error {
  constructor(message, url) {
    super(message);
    this.name = "CrawlerError";
    this.url = url;
  }
}

function printError(error, currentURL) {
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

module.exports = printError;
