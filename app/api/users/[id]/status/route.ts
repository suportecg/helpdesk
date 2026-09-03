export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { toggleUserStatus } from "@/services/user/user.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const { id } = await params;
    const { isActive } = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    const updated = await toggleUserStatus(id, Boolean(isActive), session.id, ipAddress);

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao alterar status do usuário", details: error.message },
      { status: 500 }
    );
  }
}
