export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { previewCsvImport } from "@/services/import/import.service";

/**
 * POST /api/import/preview
 * Receives CSV file, returns preview without importing
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
    const preview = await previewCsvImport(text);

    return NextResponse.json(preview);
  } catch (error: any) {
    console.error("[POST /api/import/preview] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao pré-visualizar CSV" },
      { status: 500 }
    );
  }
}
