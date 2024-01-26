
const pool = require('../db/pool');
const { fetchPortfolioForUser, saveStockOptionData, addStockOptionToPortfolio, hedgeUserPortfolio, saveStockOptionDataBulk,fetchHedgedPortfolioForUser } = require('../services/portfolioService');
const { fetchStockOptionData, fetchStockOptionsByTicker, getOrCreateStockOption } = require('../services/stockOptionService');
var express = require('express');
var router = express.Router();

router.get('/', async (req, res) => {
  try {
    const portfolioData = await fetchPortfolioForUser('test'); 
    res.json(portfolioData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/update/:tickerSymbol', async (req, res) => {
  console.log("Update route accessed");
  try {
    const tickerSymbol = req.params.tickerSymbol; 

    const stockOptionData = await fetchStockOptionData(tickerSymbol);
    console.log("Fetched stock option data:", stockOptionData);

    res.status(200).send(`Stock option data updated for ${tickerSymbol}`);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const portfolio = await fetchPortfolioForUser(username);
    res.json(portfolio);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});


router.post('/add-to-portfolio', async (req, res) => {
  try {
    console.log("Received data:", req.body);
    const { username, stockOption, position, quantity } = req.body;

    
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }
    const userId = userResult.rows[0].id;

    
    const stockOptionId = await getOrCreateStockOption(stockOption);

    
    const insertPortfolioQuery = 'INSERT INTO user_portfolios (user_id, stock_option_id, position, quantity, created_at) VALUES ($1, $2, $3, $4, NOW())';
    await pool.query(insertPortfolioQuery, [userId, stockOptionId, position, quantity]);

    res.status(200).send('Stock option added to the portfolio');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get('/hedge-portfolio/:username', async (req, res) => {
  try {
    const username = req.params.username;

    
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }
    const userId = userResult.rows[0].id;

    
    const portfolio = await fetchPortfolioForUser(username);

    if (!portfolio || portfolio.length === 0) {
      return res.status(404).send('No portfolio found for user');
    }

    await hedgeUserPortfolio(portfolio, userId);

    const hedgedPortfolio = await fetchHedgedPortfolioForUser(username);
    res.status(200).json(hedgedPortfolio);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

router.get('/stock-options/:tickerSymbol', async (req, res) => {
  try {
    const tickerSymbol = req.params.tickerSymbol;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    const stockOptions = await fetchStockOptionData(tickerSymbol, startDate, endDate);
    console.log("Fetched stock option data:", stockOptions);

    res.json(stockOptions);
  } catch (err) {
    console.error('Error in /stock-options/:tickerSymbol route:', err);
    res.status(500).send(err.message);
  }
});

router.get('/hedged-portfolio/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const hedgedPortfolio = await fetchHedgedPortfolioForUser(username);
    res.json(hedgedPortfolio);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
