const bcrypt = require('bcrypt');
const pool = require('../db/pool'); 

const registerUser = async (username, password, email) => {
  
  const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
  if (existingUser.rows.length > 0) {
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await pool.query(
    'INSERT INTO users (username, password_hash, email, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
    [username, passwordHash, email]
  );

  return newUser.rows[0].id;
};


const authenticateUser = async (username, password) => {
    const user = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [username]);
    
    if (user.rows.length === 0) {
      throw new Error('User not found');
    }
  
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    
    if (!isMatch) {
      throw new Error('Invalid password');
    }
  
    return user.rows[0].id;
  };

  
module.exports = {
  registerUser,
  authenticateUser
};
