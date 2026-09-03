export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { changeUserPassword } from "@/services/user/user.service";

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
    const { newPassword } = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve conter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const result = await changeUserPassword(id, newPassword, session.id, ipAddress);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao alterar senha", details: error.message },
      { status: 500 }
    );
  }
}
