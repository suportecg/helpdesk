import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        subject: data.subject ?? existing.subject,
        bodyHtml: data.bodyHtml ?? existing.bodyHtml,
        showPriority: data.showPriority ?? existing.showPriority,
        showStatus: data.showStatus ?? existing.showStatus,
        primaryColor: data.primaryColor !== undefined ? data.primaryColor : existing.primaryColor,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[EmailTemplates PUT] Erro:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[EmailTemplates DELETE] Erro:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
