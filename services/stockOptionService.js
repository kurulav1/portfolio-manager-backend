// services/stockOptionService.js
const axios = require('axios');
const pool = require('../db/pool');
 

async function fetchStockOptionData(tickerSymbol) {
  try {
    const response = await axios.get(`${process.env.DATA_SERVICE_URL}/options/${tickerSymbol}`);
    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function saveStockOptionData2(data) {
  if (!data.stockOption) {
    console.warn(`Skipping option due to null ticker_symbol.`);
    return;
  }
  const upsertQuery = `
    INSERT INTO stockoptions (ticker_symbol, strike_price, expiration_date, option_type, created_at, market_price, implied_volatility)
    VALUES ($1, $2, $3, $4, NOW(), $5, $6)
    ON CONFLICT (ticker_symbol, strike_price, expiration_date, option_type) 
    DO UPDATE SET market_price = EXCLUDED.market_price, implied_volatility = EXCLUDED.implied_volatility
    WHERE EXCLUDED.ticker_symbol IS NOT NULL;  
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



async function fetchStockOptionsByTicker(tickerSymbol) {
  const stock_options = await fetchStockOptionData(tickerSymbol);
  try {
    const stockOptionsQuery = `
      SELECT 
        id, 
        ticker_symbol AS "tickerSymbol", 
        strike_price AS "strikePrice", 
        expiration_date AS "expirationDate", 
        option_type AS "optionType", 
        created_at AS "createdAt", 
        market_price AS "marketPrice", 
        implied_volatility AS "impliedVolatility"
      FROM 
        stockoptions 
      WHERE 
        ticker_symbol = $1;
    `;

    const stockOptionsResult = await pool.query(stockOptionsQuery, [tickerSymbol]);
    return stockOptionsResult.rows;
  } catch (err) {
    console.error('Error fetching stock options by ticker:', err);
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

async function fetchStockOptionData(tickerSymbol, start_date, end_date) {
  try {
    let url = `${process.env.DATA_SERVICE_URL}/options/${tickerSymbol}`;
    const params = [];
    if (start_date) {
      params.push(`start_date=${start_date}`);
    }
    if (end_date) {
      params.push(`end_date=${end_date}`);
    }
    if (params.length) {
      url += `?${params.join('&')}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getOrCreateStockOption(stockOption) {
  console.log(stockOption);
  const { tickerSymbol, strikePrice, expirationDate, optionType, marketPrice } = stockOption;
  if (!tickerSymbol || !strikePrice || !expirationDate || !optionType) {
    throw new Error('Missing required stock option fields');
  }

  const existingOptionQuery = 'SELECT id FROM stockoptions WHERE ticker_symbol = $1 AND strike_price = $2 AND expiration_date = $3 AND option_type = $4';
  const existingOptionResult = await pool.query(existingOptionQuery, [tickerSymbol, strikePrice, expirationDate, optionType]);

  let stockOptionId;
  if (existingOptionResult.rows.length > 0) {
    stockOptionId = existingOptionResult.rows[0].id;
  } else {
    const insertOptionQuery = 'INSERT INTO stockoptions (ticker_symbol, strike_price, expiration_date, option_type, created_at, market_price, implied_volatility) VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING id';
    const insertOptionResult = await pool.query(insertOptionQuery, [tickerSymbol, strikePrice, expirationDate, optionType, marketPrice, impliedVolatility]);
    stockOptionId = insertOptionResult.rows[0].id;
  }

  return stockOptionId;
}
module.exports = { fetchStockOptionData, fetchStockOptionsByTicker, getOrCreateStockOption };
