// routes/portfolio.js
var express = require('express');
var router = express.Router();

// Dummy data
const dummyPortfolio = [
  { id: 1, stockOption: 'AAPL', quantity: 50, position: 'long', optionType: 'call' },
  { id: 2, stockOption: 'MSFT', quantity: 50, position: 'short', optionType: 'put' },
];

// Route to get portfolio data
router.get('/', function(req, res, next) {
  res.json(dummyPortfolio);
});

module.exports = router;
