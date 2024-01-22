// services/portfolioService.js
const pool = require('../db/pool');
const { fetchStockOptionData } = require('./stockOptionService');

async function fetchPortfolioForUser(username) {
  try {
    // Fetch user ID based on username
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    const userId = userResult.rows[0].id;

    // Fetch user's portfolio entries
    const portfolioQuery = `
      SELECT 
        up.id, 
        so.ticker_symbol AS "stockOption", 
        up.quantity, 
        up.position, 
        so.option_type AS "optionType",
        so.market_price AS "marketPrice"
      FROM 
        user_portfolios up
      JOIN 
        stockoptions so ON up.stock_option_id = so.id
      WHERE 
        up.user_id = $1;
    `;

    const portfolioResult = await pool.query(portfolioQuery, [userId]);
    return portfolioResult.rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function saveStockOptionData(data) {
  const updateQuery = `
    UPDATE stockoptions
    SET market_price = $2
    WHERE ticker_symbol = $1;
  `;

  await pool.query(updateQuery, [data.tickerSymbol, data.marketPrice]);
}

async function saveStockOptionData(data) {
  const upsertQuery = `
    INSERT INTO stockoptions (ticker_symbol, strike_price, expiration_date, option_type, created_at, market_price)
    VALUES ($1, $2, $3, $4, NOW(), $5)
    ON CONFLICT (ticker_symbol, strike_price, expiration_date, option_type)
    DO UPDATE SET market_price = EXCLUDED.market_price;
  `;

  await pool.query(upsertQuery, [
    data.stockOption,
    data.strikePrice, 
    data.expirationDate, 
    data.optionType, 
    data.marketPrice
  ]);
}


module.exports = { fetchPortfolioForUser, saveStockOptionData };
