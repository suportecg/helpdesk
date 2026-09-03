export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { suggestRequesters, getRequesterHistory } from "@/services/requester/requester.service";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const requesterId = searchParams.get("requesterId");

    // Se foi solicitado histórico de um solicitante específico
    if (requesterId) {
      const history = await getRequesterHistory(requesterId);
      return NextResponse.json({ history });
    }

    // Busca sugestões por nome ou e-mail
    const suggestions = await suggestRequesters(query);
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("[HelpDesk API] Erro ao consultar solicitantes:", error);
    return NextResponse.json(
      { message: error?.message || "Erro interno ao buscar solicitantes" },
      { status: 500 }
    );
  }
}
