
const pool = require('../db/pool');
const { fetchStockOptionData } = require('./stockOptionService');
const { calculateOptionDelta } = require('./analyticsService'); 

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
    up.id, 
    so.id AS "stockOptionId",
    so.ticker_symbol AS "stockOption", 
    up.quantity, 
    up.position, 
    so.option_type AS "optionType",
    so.strike_price AS "strikePrice",
    so.expiration_date AS "expirationDate",
    so.market_price AS "marketPrice",
    so.implied_volatility AS "impliedVolatility"
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
  await deleteExpiredOptions();

  if (!data.stockOption) {
    console.warn(`Skipping option due to null ticker_symbol.`);
    return;
  }

  if (!data.stockOption) {
    console.warn(`Skipping option due to null ticker_symbol.`);
    return;
  }


  const upsertQuery = `
    INSERT INTO stockoptions (ticker_symbol, strike_price, expiration_date, option_type, created_at, market_price, implied_volatility)
    VALUES ($1, $2, $3, $4, NOW(), $5, $6)
    ON CONFLICT (ticker_symbol, strike_price, expiration_date, option_type)
    DO UPDATE SET market_price = EXCLUDED.market_price, implied_volatility = EXCLUDED.implied_volatility
    WHERE EXCLUDED.ticker_symbol IS NOT NULL;  -- Add this condition to exclude null ticker_symbols
  `;

  await pool.query(upsertQuery, [
    data.stockOption,
    data.strikePrice, 
    data.expirationDate, 
    data.optionType, 
    data.marketPrice,
    data.impliedVolatility
  ]);
}

async function addStockOptionToPortfolio(userId, stockOptionId, position, quantity) {
  try {
    const insertQuery = `
      INSERT INTO user_portfolios (user_id, stock_option_id, position, quantity, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;

    await pool.query(insertQuery, [userId, stockOptionId, position, quantity]);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function hedgeUserPortfolio(portfolio, userId) {
  for (const option of portfolio) {
    if (isNaN(option.marketPrice)) {
      console.warn(`Skipping option ${option.stockOption} due to invalid market price.`);
      continue;
    }
    if (isNaN(option.strikePrice)) {
      console.warn(`Skipping option ${option.stockOption} due to invalid strike price.`);
      continue;
    }
    if (isNaN(option.impliedVolatility)) {
      console.warn(`Skipping option ${option.stockOption} due to invalid implied volatility.`);
      continue;
    }

    try {
      const delta = await calculateOptionDelta({
        marketPrice: option.marketPrice,
        strikePrice: option.strikePrice,
        expirationDate: option.expirationDate,
        optionType: option.optionType,
        impliedVolatility: option.impliedVolatility
      });

      const hedgedQuantity = Math.round(option.quantity * delta);

      await addStockOptionToHedgedPortfolio(userId, option.stockOptionId, 'long', hedgedQuantity);
    } catch (error) {
      console.error(`Error in hedging option for ${option.stockOption}:`, error.message);
    }
  }
}

async function addStockOptionToHedgedPortfolio(userId, stockOptionId, position, quantity) {
  const insertQuery = `
    INSERT INTO hedged_user_portfolios (user_id, stock_option_id, position, quantity, created_at)
    VALUES ($1, $2, $3, $4, NOW());
  `;

  await pool.query(insertQuery, [userId, stockOptionId, position, quantity]);
}

function calculateTimeToExpiration(expirationDate) {
  const currentDate = new Date();
  const expiryDate = new Date(expirationDate);

  const timeDiff = expiryDate.getTime() - currentDate.getTime();
  const daysTillExpiration = timeDiff / (1000 * 3600 * 24);
  const yearsTillExpiration = daysTillExpiration / 365;

  return yearsTillExpiration;
}

async function deleteExpiredOptions() {
  try {
    const currentDate = new Date();

    const deleteUserPortfoliosQuery = `
      DELETE FROM user_portfolios
      WHERE stock_option_id IN (
        SELECT id
        FROM stockoptions
        WHERE expiration_date < $1
      );
    `;
    await pool.query(deleteUserPortfoliosQuery, [currentDate]);

    const deleteStockOptionsQuery = `
      DELETE FROM stockoptions
      WHERE expiration_date < $1;
    `;
    
    const deleteResult = await pool.query(deleteStockOptionsQuery, [currentDate]);
    
    return deleteResult.rowCount;
  } catch (err) {
    console.error('Error deleting expired options:', err);
    throw err;
  }
}

async function saveStockOptionDataBulk(stockOptions) {
  if (stockOptions.length === 0) {
    return;
  }

  const values = stockOptions.map(opt => `(${opt.stockOption}, ${opt.strikePrice}, ${opt.expirationDate}, ${opt.optionType}, NOW(), ${opt.marketPrice}, ${opt.impliedVolatility})`).join(',');

  const upsertQuery = `
    INSERT INTO stockoptions (ticker_symbol, strike_price, expiration_date, option_type, created_at, market_price, implied_volatility)
    VALUES ${values}
    ON CONFLICT (ticker_symbol, strike_price, expiration_date, option_type) 
    DO UPDATE SET market_price = EXCLUDED.market_price, implied_volatility = EXCLUDED.implied_volatility;
  `;

  await pool.query(upsertQuery);
}

async function fetchHedgedPortfolioForUser(username) {
  try {
    const userQuery = 'SELECT id FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, [username]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    const userId = userResult.rows[0].id;

    const hedgedPortfolioQuery = `
    SELECT 
      hp.id, 
      so.ticker_symbol AS "stockOption", 
      hp.quantity, 
      hp.position, 
      so.option_type AS "optionType",
      so.strike_price AS "strikePrice",
      so.expiration_date AS "expirationDate",
      so.market_price AS "marketPrice",
      so.implied_volatility AS "impliedVolatility"
    FROM 
      hedged_user_portfolios hp
    JOIN 
      stockoptions so ON hp.stock_option_id = so.id
    WHERE 
      hp.user_id = $1;
    `;

    const hedgedPortfolioResult = await pool.query(hedgedPortfolioQuery, [userId]);
    return hedgedPortfolioResult.rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = { 
  fetchPortfolioForUser, 
  saveStockOptionData, 
  addStockOptionToPortfolio, 
  hedgeUserPortfolio,
  addStockOptionToHedgedPortfolio,
  deleteExpiredOptions,
  saveStockOptionDataBulk,
  fetchHedgedPortfolioForUser,
};