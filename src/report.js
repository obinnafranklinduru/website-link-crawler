/**
 * Print a report of crawled pages with their occurrence counts
 * @param {Object} pages - Object containing crawled pages and their occurrence counts
 */
function printReport(pages) {
  console.log("\n==========");
  console.log("REPORT");
  console.log("==========\n");
  // Sort pages by occurrence count
  const sortedPages = sortPages(pages);
  // Print each page along with its occurrence count
  for (const sortedPage of sortedPages) {
    const url = sortedPage[0];
    const count = sortedPage[1];
    console.log(`Found ${count} internal links to ${url}`);
  }
}

/**
 * Sort pages based on their occurrence counts
 * @param {Object} pages - Object containing crawled pages and their occurrence counts
 * @returns {Array<Array>} - Array of page-count pairs sorted by count in descending order
 */
function sortPages(pages) {
  const pagesArr = Object.entries(pages);
  // Sort pages array by occurrence count in descending order
  pagesArr.sort((pageA, pageB) => {
    return pageB[1] - pageA[1];
  });
  return pagesArr;
}

module.exports = {
  printReport,
  sortPages,
};
