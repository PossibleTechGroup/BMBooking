const fs = require('fs');
const path = require('path');
const { query } = require('./db');

const initDb = async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../models/schema.sql'), 'utf8');
    await query(sql);
    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Error initializing database schema:', err);
    throw err;
  }
};

module.exports = initDb;
