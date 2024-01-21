// routes/portfolio.js
const pool = require('../db/pool');
const { fetchPortfolioForUser } = require('../services/portfolioService');

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

module.exports = router;
