export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import {
  getCorporateSettings,
  updateCorporateSettings,
} from "@/services/settings/settings.service";

export async function GET() {
  try {
    const settings = await getCorporateSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Erro ao obter configurações corporativas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações do sistema" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateCorporateSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Erro ao atualizar configurações corporativas:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar configurações do sistema" },
      { status: 500 }
    );
  }
}
