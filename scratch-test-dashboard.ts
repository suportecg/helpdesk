import { getOperationalDashboardData } from "./services/dashboard/dashboard.service";

async function main() {
  const data = await getOperationalDashboardData({ period: "TODAY" });
  console.log(JSON.stringify(data.charts.byHour, null, 2));
}

main().catch(console.error);
