const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT id, "ticketNumber", "ticketMonthYear", "problem" FROM tickets WHERE "ticketNumber" = 69');
  console.log(res.rows);
  await client.end();
}
run();
