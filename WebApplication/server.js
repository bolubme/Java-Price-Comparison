const express = require("express");
const url = require("url");
const path = require("path");

// Importing custom modules
require("./http_status.js");
const db = require("./client.js");
const { error } = require("console");

const app = express();

// Serving static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET endpoint for the home page.
 */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });


/**
 * GET endpoint to search for laptops based on provided parameters.
 */
app.get("/search", async (req, res) => {
  try {
    const numOfItems = req.query.num_items;
    const offset = req.query.offset;
    const descrip = req.query.model_name;

    const prodCount = await db.getTotalProductCountBySearch(descrip)
    const laptops = await db.searchLaptop(descrip, numOfItems, offset);

    const Obj = {
      count: prodCount,
      data: laptops,
    };

    res.json(Obj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * Retrieves comparison data for a specific laptop.
 * @param {import('express').Request} req - The request object containing URL parameters.
 * @param {import('express').Response} res - The response object to send the comparison data.
 * @returns {void} - No return value.
 */

app.get("/comparison/*", (req, res) => {
  const pathEnd = getPathEnd(req.url);

  let regEx = new RegExp("^[0-9]+$");
  if (regEx.test(pathEnd)) {
    db.getComparison(pathEnd)
      .then((laptop) => {
        res.json(laptop);
      })
      .catch((error) => console.log(error.message));
  } else {
    res.status(HTTP_STATUS.NOT_FOUND);
    res.send(
      "{ERROR: Comparison ID: '" +
        getPathEnd(req.url) +
        "', from URL: '" +
        req.url +
        "' is not valid}"
    );
  }
});


/**
 * Retrieves comparison data for laptops based on specific parameters like model, storage, and memory.
 * @param {import('express').Request} req - The request object containing URL parameters.
 * @param {import('express').Response} res - The response object to send the comparison data.
 * @returns {Promise<void>} - A promise resolving to undefined.
 */

app.get("/comparisonSearch", async (req, res) => {
  // Get number of items and offset
  let [numOfItems, offset] = getNumOfItemsOffset(req.url);
  // Get model of phone
  let [modelName] = getModel(req.url);
  let [storage] = getStorage(req.url);
  let [memory] = getMemory(req.url);
  let [processor] = getProcessor(req.url);
  let [display] = getDisplay(req.url)
  let [release_year] = getYear(req.url)

  let searchCount = await db.getComparisonSearchCount(
    modelName,
    storage,
    memory,
    display,
    processor,
    release_year
);

  //Retrieve all of the products matching the search to compare all relevant products
  let laptops = await db.getComparisonSearch(
    modelName,
    storage,
    memory,
    display,
    processor,
    release_year,
    numOfItems,
    offset
  );

  //Combine into a single object and send back to client
  let returnObj = {
    count: searchCount,
    data: laptops,
  };
  res.json(returnObj);
});


/**
 * Start the server on port 8000.
 */
app.listen(8000);
console.log("Server listening on port 8000");

module.exports = app;


/**
 * Extracts the number of items and offset from the URL query string.
 * @param {string} urlStr - The URL string containing the query parameters.
 * @returns {Array} An array containing the number of items and the offset.
 */
const getNumOfItemsOffset = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let queries = urlObj.query;

  let numOfItems = queries["num_items"];
  let offset = queries["offset"];

  return [numOfItems, offset];
};


/**
 * Extracts the model name from the URL query string.
 * @param {string} urlStr - The URL string containing the query parameters.
 * @returns {Array} An array containing the model name.
 */
const getModel = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let queries = urlObj.query;

  let modelName = queries["model_name"];

  return [modelName];
};


/**
 * Extracts the storage from the URL query string.
 * @param {string} urlStr - The URL string containing the query parameters.
 * @returns {Array} An array containing the storage value.
 */
const getStorage = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let queries = urlObj.query;

  let storage = queries["storage"];

  return [storage];
};


/**
 * Extracts the memory from the URL query string.
 * @param {string} urlStr - The URL string containing the query parameters.
 * @returns {Array} An array containing the memory value.
 */
const getMemory = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let queries = urlObj.query;

  let memory = queries["memory"];

  return [memory];
};


/**
 * Extracts the Display from the URL query string.
 * @param {string} urlStr - The URL string containing the query parameters.
 * @returns {Array} An array containing the brand value.
 */
const getDisplay = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let queries = urlObj.query;

  let display = queries["display"];

  return [display];
};

/**
 * Extracts the year from the URL query string.
 * @param {string} urlStr - The URL string containing the query parameters.
 * @returns {Array} An array containing the brand value.
 */
const getYear = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let queries = urlObj.query;

  let release_year = queries["release_year"];

  return [release_year];
};

/**
 * Extracts the processor from the URL query string.
 * @param {string} urlStr - The URL string containing the query parameters.
 * @returns {Array} An array containing the brand value.
 */
const getProcessor = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let queries = urlObj.query;

  let processor = queries["processor"];

  return [processor];
};

/**
 * Extracts the last segment of the URL path.
 * @param {string} urlStr - The URL string containing the path.
 * @returns {string} The last segment of the URL path.
 */

const getPathEnd = function (urlStr) {
  let urlObj = url.parse(urlStr, true);

  let pathArray = urlObj.pathname.split("/");

  return pathArray[pathArray.length - 1];
};
