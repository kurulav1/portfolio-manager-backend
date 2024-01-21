const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'portfolio-manager-db.postgres.database.azure.com',
  database: 'postgres', // Replace with your database name
  password: process.env.DB_CREDENTIAL,
  port: 5432, // Default PostgreSQL port
  ssl: {
    rejectUnauthorized: false // Necessary for Azure connections
  }
});

module.exports = pool;
