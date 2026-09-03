import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days");

    let whereClause = {};

    if (days) {
      const parsedDays = parseInt(days, 10);
      if (isNaN(parsedDays) || parsedDays < 0) {
        return NextResponse.json({ error: "O parâmetro 'days' deve ser um número positivo." }, { status: 400 });
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parsedDays);
      
      whereClause = {
        processedAt: {
          lt: cutoffDate
        }
      };
    } else {
      // Se não enviou 'days', apaga todos
      whereClause = {};
    }

    const result = await prisma.processedEmail.deleteMany({
      where: whereClause
    });

    return NextResponse.json({ 
      success: true, 
      message: `Foram apagados ${result.count} registros de e-mails.`,
      count: result.count
    });

  } catch (error: any) {
    console.error("[Email Cleanup] Erro:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
