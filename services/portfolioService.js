// services/portfolioService.js
const pool = require('../db/pool');
const { fetchStockOptionData } = require('./stockOptionService');

async function fetchPortfolioForUser(username) {
  try {
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userId = userResult.rows[0].id;

    const portfolioQuery = `
      SELECT 
        ps.id, 
        ps.ticker_symbol AS "stockOption", 
        ps.quantity, 
        ps.position, 
        ps.option_type AS "optionType"
      FROM 
        portfolios p
      JOIN 
        portfolio_stock_options ps ON p.id = ps.portfolio_id
      WHERE 
        p.user_id = $1;
    `;

    const portfolioResult = await pool.query(portfolioQuery, [userId]);
    const portfolio = portfolioResult.rows;

    for (let i = 0; i < portfolio.length; i++) {
      const stockOptionData = await fetchStockOptionData(portfolio[i].stockOption);
      portfolio[i].stockOptionData = stockOptionData;

      for (const data of stockOptionData) {
        await saveStockOptionData(data);
      }
    }

    return portfolio;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function saveStockOptionData(data) {
  const insertOrUpdateQuery = `
    INSERT INTO stock_options (ticker_symbol, market_price, ...)
    VALUES ($1, $2, ...)
    ON CONFLICT (ticker_symbol) DO UPDATE
    SET market_price = EXCLUDED.market_price, ...;
  `;

  await pool.query(insertOrUpdateQuery, [data.tickerSymbol, data.marketPrice, ...]);
}

module.exports = { fetchPortfolioForUser };
