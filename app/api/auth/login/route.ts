export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";
import { UserSession } from "@/types/rbac.types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Por favor, informe e-mail e senha." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Credenciais inválidas ou usuário inativo." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Credenciais inválidas." },
        { status: 401 }
      );
    }

    const session: UserSession = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
    };

    await setSessionCookie(session);

    return NextResponse.json({
      message: "Login realizado com sucesso",
      user: session,
    });
  } catch (error) {
    console.error("[HelpDesk API] Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno ao processar autenticação." },
      { status: 500 }
    );
  }
}
