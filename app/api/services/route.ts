export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        slaHours: true,
      },
    });

    return NextResponse.json(services, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao listar serviços", details: error.message },
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

    if (session.role !== "ADMIN" && session.role !== "TI") {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "O nome do serviço é obrigatório." }, { status: 400 });
    }

    const newService = await prisma.service.create({
      data: {
        name: body.name,
        category: body.category || null,
        description: body.description || null,
        slaHours: body.slaHours ? parseInt(body.slaHours, 10) : null,
        isActive: true,
      }
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao criar serviço", details: error.message },
      { status: 500 }
    );
  }
}
