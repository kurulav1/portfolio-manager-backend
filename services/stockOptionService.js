// services/stockOptionService.js
const axios = require('axios');

async function fetchStockOptionData(tickerSymbol) {
  try {
    const response = await axios.get(`${process.env.DATA_SERVICE_URL}/options/${tickerSymbol}`);
    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = { fetchStockOptionData };
