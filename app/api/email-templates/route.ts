import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("[EmailTemplates GET] Erro:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "TI")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.code || !data.name || !data.subject || !data.bodyHtml) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const existing = await prisma.emailTemplate.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json({ error: "Já existe um template com este código" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        code: data.code,
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        showPriority: data.showPriority ?? true,
        showStatus: data.showStatus ?? true,
        primaryColor: data.primaryColor || null,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("[EmailTemplates POST] Erro:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
