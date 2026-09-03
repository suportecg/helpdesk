export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/report-layouts/[id]
 * Update a report layout (rename, set default, update config)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, config, isDefault } = body;

    const existing = await prisma.reportLayout.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Layout não encontrado." }, { status: 404 });
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.reportLayout.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.reportLayout.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(config !== undefined && { config }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PUT /api/report-layouts/[id]] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar layout" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/report-layouts/[id]
 * Delete a report layout (cannot delete the default)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.reportLayout.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Layout não encontrado." }, { status: 404 });
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { error: "Não é possível excluir o layout padrão." },
        { status: 400 }
      );
    }

    await prisma.reportLayout.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Layout excluído." });
  } catch (error: any) {
    console.error("[DELETE /api/report-layouts/[id]] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao excluir layout" },
      { status: 500 }
    );
  }
}
