export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tickets/months
 * Returns distinct ticketMonthYear values ordered DESC
 * Used to populate the month selector in UI
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = await prisma.ticket.findMany({
      where: { deletedAt: null },
      select: { ticketMonthYear: true },
      distinct: ["ticketMonthYear"],
      orderBy: { ticketMonthYear: "desc" },
    });

    const months = result.map((r) => r.ticketMonthYear).filter(Boolean);

    // Ensure current month is always included
    const now = new Date();
    const currentMonthYear = `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
    if (!months.includes(currentMonthYear)) {
      months.unshift(currentMonthYear);
    }

    // Format for display
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];

    const formatted = months.map((my) => {
      const [mm, yyyy] = my.split("-");
      const monthIdx = parseInt(mm, 10) - 1;
      return {
        value: my,
        label: `${monthNames[monthIdx]} ${yyyy}`,
        month: parseInt(mm, 10),
        year: parseInt(yyyy, 10),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("[GET /api/tickets/months] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao listar meses disponíveis" },
      { status: 500 }
    );
  }
}
