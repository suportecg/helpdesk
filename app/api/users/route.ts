export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUsersPaginated, createUser } from "@/services/user/user.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const data = await getUsersPaginated({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder,
      includeInactive,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/users] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuários", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const body = await request.json();
    const ipAddress = request.headers.get("x-forwarded-for") || undefined;

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { error: "Nome, e-mail e papel (Role) são obrigatórios." },
        { status: 400 }
      );
    }

    const newUser = await createUser(body, session.id, ipAddress);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/users] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário", details: error.message },
      { status: 500 }
    );
  }
}
