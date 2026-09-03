import fs from "fs";

async function main() {
  const fileBuffer = fs.readFileSync("/tmp/last-upload.csv");
  const blob = new Blob([fileBuffer], { type: "text/csv" });
  
  const fd = new FormData();
  fd.append("file", blob, "last-upload.csv");

  try {
    const res = await fetch("http://localhost:3000/api/tickets/import", {
      method: "POST",
      body: fd,
      headers: {
         // Cookie is tricky to mock if the route requires authentication
      }
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.error("Fetch falhou:", e);
  }
}
main();
