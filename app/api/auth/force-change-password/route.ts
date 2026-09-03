export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";
import { UserSession } from "@/types/rbac.types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, oldPassword, newPassword } = body;

    if (!email || !oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Por favor, preencha todos os campos." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "A nova senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Usuário não encontrado ou inativo." },
        { status: 404 }
      );
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Senha atual inválida." },
        { status: 401 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        requirePasswordChange: false,
      },
    });

    const session: UserSession = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      department: updatedUser.department,
    };

    await setSessionCookie(session);

    return NextResponse.json({
      message: "Senha alterada e login realizado com sucesso.",
      user: session,
    });
  } catch (error) {
    console.error("[HelpDesk API] Erro no force-change-password:", error);
    return NextResponse.json(
      { message: "Erro interno ao processar a troca de senha." },
      { status: 500 }
    );
  }
}
