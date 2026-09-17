export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserPermissionsMap } from "@/services/rbac/rbac.service";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { permissionCodes } = await getUserPermissionsMap(session.id);
    const userWithPermissions = {
      ...session,
      permissions: permissionCodes,
    };

    return NextResponse.json({ user: userWithPermissions });
  } catch (error) {
    console.error("[HelpDesk API] Erro ao recuperar sessão:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
