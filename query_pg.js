const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT t.id as ticket_id, t."ticketNumber", p.id as pe_id, p."from", p.status, p."bodyReceived" IS NOT NULL as has_body FROM tickets t JOIN processed_emails p ON t.id = p."ticketId" WHERE t."ticketNumber" = 69');
  console.log(res.rows);
  await client.end();
}
run();
