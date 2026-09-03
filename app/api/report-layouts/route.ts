export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/report-layouts
 * List all report layouts
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const layouts = await prisma.reportLayout.findMany({
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(layouts);
  } catch (error: any) {
    console.error("[GET /api/report-layouts] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao listar layouts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/report-layouts
 * Create a new report layout
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, config, isDefault } = body;

    if (!name || !config) {
      return NextResponse.json(
        { error: "Nome e configuração são obrigatórios." },
        { status: 400 }
      );
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.reportLayout.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const layout = await prisma.reportLayout.create({
      data: {
        name,
        config,
        isDefault: isDefault || false,
        createdBy: session.id,
      },
    });

    return NextResponse.json(layout, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/report-layouts] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao criar layout" },
      { status: 500 }
    );
  }
}
