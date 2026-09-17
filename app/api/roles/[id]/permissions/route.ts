export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/services/audit/audit.service";

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

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: {
        permission: true,
      },
    });

    const permissionCodes = rolePermissions.map((rp) => rp.permission.code);

    return NextResponse.json({
      roleId: id,
      permissionCodes,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar permissões da função", details: error.message },
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
    const body = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;
    const permissions: { permissionId: string }[] = body.permissions || [];

    // Verifique se a Role existe
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return NextResponse.json({ error: "Função não encontrada" }, { status: 404 });
    }

    // Substituir transacionalmente as permissões da Role
    await prisma.$transaction(async (tx) => {
      // Remover permissões atuais
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Inserir novas permissões
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId: id,
            permissionId: p.permissionId,
          })),
        });
      }
    });

    await logAuditEvent({
      userId: session.id || null,
      action: "CHANGE_ROLE_PERMISSIONS",
      entity: "Role",
      entityId: id,
      details: `Permissões da função ${role.name} atualizadas. Total de regras: ${permissions.length}`,
      ipAddress,
    });

    return NextResponse.json({ success: true, count: permissions.length }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao atualizar permissões da função", details: error.message },
      { status: 500 }
    );
  }
}
