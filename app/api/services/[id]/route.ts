export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        description: body.description,
        slaHours: body.slaHours ? parseInt(body.slaHours, 10) : null,
      },
    });

    return NextResponse.json(updatedService, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao atualizar serviço", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Permissão insuficiente." }, { status: 403 });
    }

    const { id } = await params;

    await prisma.service.update({
      where: { id },
      data: { 
        isActive: false,
        deletedAt: new Date()
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao deletar serviço", details: error.message },
      { status: 500 }
    );
  }
}
