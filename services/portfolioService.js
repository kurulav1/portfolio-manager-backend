const pool = require('../db/pool');

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
      return portfolioResult.rows;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  
  module.exports = { fetchPortfolioForUser };
