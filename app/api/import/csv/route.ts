export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeCsvImport } from "@/services/import/import.service";

/**
 * POST /api/import/csv
 * Receives CSV file, executes full import
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "TI") {
      return NextResponse.json(
        { error: "Apenas administradores ou TI podem importar dados." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const text = await file.text();
    const result = await executeCsvImport(text, session.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/import/csv] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao importar CSV" },
      { status: 500 }
    );
  }
}
