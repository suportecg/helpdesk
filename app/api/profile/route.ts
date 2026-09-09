import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        signatureHtml: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[Profile API] Erro no GET:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, password, signatureHtml } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (signatureHtml !== undefined) {
      // Purify signature on server just to be safe
      const sanitizeHtml = require("sanitize-html");
      dataToUpdate.signatureHtml = sanitizeHtml(signatureHtml, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'span', 'div' ]),
          allowedSchemes: [ 'http', 'https', 'ftp', 'mailto', 'tel', 'data' ],
          allowedSchemesByTag: {
            img: [ 'data', 'http', 'https' ],
          },
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            '*': ['style', 'class', 'align', 'valign', 'width', 'height', 'cellpadding', 'cellspacing', 'border', 'colspan', 'rowspan'],
            'a': ['href', 'name', 'target', 'rel', 'style', 'class'],
            'img': ['src', 'alt', 'width', 'height', 'style', 'class', 'referrerpolicy']
          }
      });
    }
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        signatureHtml: true,
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("[Profile API] Erro no PUT:", error);
    return NextResponse.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}
