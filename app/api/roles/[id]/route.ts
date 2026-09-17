import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, label, description, permissions } = await req.json();

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: name?.toUpperCase(),
        label,
        description,
      },
    });

    if (permissions !== undefined) {
      // Deletar as antigas e inserir as novas
      await prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((pId: string) => ({
              roleId: id,
              permissionId: pId,
            })),
          });
        }
      });
    }

    return NextResponse.json(role);
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao atualizar função" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Função não encontrada" }, { status: 404 });
    }

    if (role.name === "ADMIN" || role.name === "TI" || role.name === "SOLICITANTE") {
      return NextResponse.json(
        { error: "Não é possível excluir as funções padrão do sistema" },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao excluir função" },
      { status: 500 }
    );
  }
}
