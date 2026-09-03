export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: "Token e nova senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "A nova senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    // Buscar token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: "Token inválido ou não encontrado." },
        { status: 400 }
      );
    }

    // Validar expiração
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json(
        { message: "O link de recuperação expirou. Por favor, solicite um novo." },
        { status: 400 }
      );
    }

    const { user } = resetToken;
    if (!user || !user.isActive || user.deletedAt) {
      return NextResponse.json(
        { message: "Usuário inativo ou não encontrado." },
        { status: 400 }
      );
    }

    // Hash nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar usuário (também tira a obrigatoriedade de mudar senha, se houver)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        requirePasswordChange: false,
      },
    });

    // Invalidar token (excluir todos os tokens desse usuário por segurança)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/auth/reset-password] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
