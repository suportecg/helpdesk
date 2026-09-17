import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        permissions: true
      }
    });
    return NextResponse.json(roles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, label, description } = await req.json();

    if (!name || !label) {
      return NextResponse.json(
        { error: "Nome e label são obrigatórios" },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findUnique({
      where: { name: name.toUpperCase() },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Já existe uma função com esse nome" },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase(),
        label,
        description,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao criar função" },
      { status: 500 }
    );
  }
}
