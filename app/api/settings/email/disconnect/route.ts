import { NextRequest, NextResponse } from "next/server";
import { getCorporateSettings, updateCorporateSettings } from "@/services/settings/settings.service";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const settings = await getCorporateSettings();
    await updateCorporateSettings({
      googleRefreshToken: null,
      emailIntegrationStatus: "DISCONNECTED",
      emailCheckError: null,
    });

    return NextResponse.json({ success: true, message: "Conta desconectada com sucesso." });
  } catch (error: any) {
    return NextResponse.json({ error: "Falha ao desconectar.", details: error.message }, { status: 500 });
  }
}
