// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',         // usualmente 'postgres'
  host: 'localhost',
  database: 'tasklim',
  password: 'clock2912',
  port: 5432,                 // por defecto PostgreSQL usa el 5432
});

module.exports = pool;
