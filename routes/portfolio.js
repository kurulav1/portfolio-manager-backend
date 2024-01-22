// routes/portfolio.js
const pool = require('../db/pool');
const { fetchPortfolioForUser, saveStockOptionData   } = require('../services/portfolioService');
const { fetchStockOptionData } = require('../services/stockOptionService');
var express = require('express');
var router = express.Router();

// Dummy data
const dummyPortfolio = [
  { id: 1, stockOption: 'AAPL', quantity: 50, position: 'long', optionType: 'call' },
  { id: 2, stockOption: 'MSFT', quantity: 50, position: 'short', optionType: 'put' },
];

router.get('/', async (req, res) => {
  try {
    const portfolioData = await fetchPortfolioForUser('test'); // Fetch for 'test' user
    res.json(portfolioData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/update/:tickerSymbol', async (req, res) => {
  console.log("Update route accessed");
  try {
    const tickerSymbol = req.params.tickerSymbol; // Accessing tickerSymbol from URL parameter

    const stockOptionData = await fetchStockOptionData(tickerSymbol);
    console.log("Fetched stock option data:", stockOptionData);

    for (const data of stockOptionData) {
      await saveStockOptionData(data);
    }

    res.status(200).send(`Stock option data updated for ${tickerSymbol}`);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get('/user/:username/portfolio', async (req, res) => {
  try {
    const username = req.params.username;
    const portfolio = await fetchPortfolioForUser(username);
    res.json(portfolio);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
