class CrawlerError extends Error {
  constructor(message, url) {
    super(message);
    this.name = "CrawlerError";
    this.url = url;
  }
}

module.exports = CrawlerError;
