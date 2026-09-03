export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error("[HelpDesk API] Erro ao recuperar sessão:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
