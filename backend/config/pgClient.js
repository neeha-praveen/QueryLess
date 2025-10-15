const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.PG_CONNECTION_STRING });

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
  process.exit(-1);
});

module.exports = pool;
