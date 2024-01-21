// services/stockOptionService.js
const axios = require('axios');

async function fetchStockOptionData(tickerSymbol) {
  try {
    const response = await axios.get(`https://portfolio-data-service.azurewebsites.net/options/${tickerSymbol}`);
    return response.data; // Assuming the data is in the expected format
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = { fetchStockOptionData };
