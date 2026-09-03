export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { removeSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await removeSessionCookie();
    return NextResponse.json({ success: true, message: "Logout realizado com sucesso" });
  } catch (error) {
    console.error("[HelpDesk API] Erro no logout:", error);
    return NextResponse.json({ success: false, message: "Erro ao realizar logout" }, { status: 500 });
  }
}
