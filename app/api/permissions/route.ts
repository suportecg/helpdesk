export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllPermissionsGrouped } from "@/services/rbac/rbac.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const groups = await getAllPermissionsGrouped();
    return NextResponse.json(groups, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao listar permissões agrupadas", details: error.message },
      { status: 500 }
    );
  }
}
