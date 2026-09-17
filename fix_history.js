const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  const correctTicketId = '929879cb-bd38-4809-8dcb-ff3242adbe05';
  const wrongTicketId = 'f1ae1cc0-d629-4114-87fd-26b4ac863334';
  
  // Find ticket histories created recently for the wrong ticket
  const res = await client.query(`SELECT id, "actorName", "description" FROM "ticket_history" WHERE "ticketId" = $1 AND "eventType" = 'CUSTOMER_REPLY'`, [wrongTicketId]);
  
  console.log("Found history:", res.rows);
  
  for (const row of res.rows) {
    if (row.description.includes('#69')) {
       await client.query(`UPDATE "ticket_history" SET "ticketId" = $1 WHERE id = $2`, [correctTicketId, row.id]);
       console.log("Updated history", row.id);
    }
  }
  
  await client.end();
}
run();
