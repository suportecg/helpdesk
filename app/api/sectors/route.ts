export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/services/rbac/rbac.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const sectors = await prisma.sector.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return NextResponse.json(sectors, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao listar setores", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Only Admin or TI can create sectors
    if (session.role !== "ADMIN" && session.role !== "TI") {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "O nome do setor é obrigatório." }, { status: 400 });
    }

    const newSector = await prisma.sector.create({
      data: {
        name: body.name,
        description: body.description || null,
        isActive: true,
      }
    });

    return NextResponse.json(newSector, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao criar setor", details: error.message },
      { status: 500 }
    );
  }
}
