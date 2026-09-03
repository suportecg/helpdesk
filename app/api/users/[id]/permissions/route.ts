export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserPermissionsMap } from "@/services/rbac/rbac.service";
import { updateUserPermissions } from "@/services/user/user.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const { id } = await params;
    const data = await getUserPermissionsMap(id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar permissões do usuário", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const { id } = await params;
    const { permissions } = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Formato de permissões inválido" },
        { status: 400 }
      );
    }

    const result = await updateUserPermissions(id, permissions, session.id, ipAddress);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao atualizar permissões do usuário", details: error.message },
      { status: 500 }
    );
  }
}
