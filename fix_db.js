const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const correctTicketId = '929879cb-bd38-4809-8dcb-ff3242adbe05';
  
  // Update the emails
  await client.query(`UPDATE processed_emails SET "ticketId" = $1 WHERE id IN ('8b494844-16e2-45b4-8d68-a7f9ffb5ea8a', 'c1b4aefe-c27d-4614-b335-e36075a902f2')`, [correctTicketId]);
  
  console.log("Processed emails updated.");
  await client.end();
}
run();
