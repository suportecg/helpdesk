import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RoleType, Prisma } from "@prisma/client";
import { logAuditEvent } from "../audit/audit.service";

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeInactive?: boolean;
}

export async function getUsersPaginated(params: UserListParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (!params.includeInactive) {
    where.deletedAt = null; // soft deleted omitidos por padrão
  }

  if (params.search && params.search.trim() !== "") {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { department: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.role && params.role !== "ALL") {
    if (params.role === "ADMIN_OR_TI" || params.role === "TECH_TEAM") {
      where.role = { in: ["ADMIN", "TI"] };
    } else {
      where.role = params.role as RoleType;
    }
  }

  if (params.status && params.status !== "ALL") {
    where.isActive = params.status === "ACTIVE";
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {};
  const validSortFields = ["name", "email", "role", "isActive", "createdAt"];
  const sortField = validSortFields.includes(params.sortBy || "") ? params.sortBy! : "createdAt";
  orderBy[sortField as keyof Prisma.UserOrderByWithRelationInput] = params.sortOrder || "desc";

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        sector: {
          select: { id: true, name: true },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => {
      const { password, ...rest } = u;
      return rest;
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      sector: true,
      userPermissions: {
        include: { permission: true },
      },
    },
  });

  if (!user || user.deletedAt) return null;
  const { password, ...rest } = user;
  return rest;
}

export async function createUser(
  data: {
    name: string;
    email: string;
    password?: string;
    role: RoleType;
    department?: string;
    sectorId?: string;
    isActive?: boolean;
  },
  actorId?: string | null,
  ipAddress?: string | null
) {
  const defaultPass = data.password || "cg2026ti";
  const hashedPassword = await bcrypt.hash(defaultPass, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      department: data.department || null,
      sectorId: data.sectorId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: {
      sector: true,
    },
  });

  await logAuditEvent({
    userId: actorId || null,
    action: "CREATE_USER",
    entity: "User",
    entityId: user.id,
    details: `Usuário ${user.name} (${user.email}) criado com papel ${user.role}`,
    ipAddress,
  });

  const { password, ...rest } = user;
  return rest;
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: RoleType;
    department?: string;
    sectorId?: string | null;
    isActive?: boolean;
  },
  actorId?: string | null,
  ipAddress?: string | null
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      sectorId: data.sectorId,
      isActive: data.isActive,
    },
    include: {
      sector: true,
    },
  });

  await logAuditEvent({
    userId: actorId || null,
    action: "UPDATE_USER",
    entity: "User",
    entityId: user.id,
    details: `Usuário ${user.name} (${user.email}) editado. Role: ${user.role}`,
    ipAddress,
  });

  const { password, ...rest } = user;
  return rest;
}

export async function deleteUser(
  id: string,
  actorId?: string | null,
  ipAddress?: string | null
) {
  // Soft Delete conforme boas práticas e solicitação da etapa
  const user = await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  await logAuditEvent({
    userId: actorId || null,
    action: "DELETE_USER",
    entity: "User",
    entityId: user.id,
    details: `Usuário ${user.name} (${user.email}) removido (Soft Delete)`,
    ipAddress,
  });

  return { success: true, id };
}

export async function toggleUserStatus(
  id: string,
  isActive: boolean,
  actorId?: string | null,
  ipAddress?: string | null
) {
  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
  });

  await logAuditEvent({
    userId: actorId || null,
    action: isActive ? "REACTIVATE_USER" : "DEACTIVATE_USER",
    entity: "User",
    entityId: user.id,
    details: `Usuário ${user.name} (${user.email}) ${isActive ? "reativado" : "desativado"}`,
    ipAddress,
  });

  return user;
}

export async function changeUserPassword(
  id: string,
  newPasswordPlain: string,
  actorId?: string | null,
  ipAddress?: string | null
) {
  const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);

  const user = await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });

  await logAuditEvent({
    userId: actorId || null,
    action: "CHANGE_PASSWORD",
    entity: "User",
    entityId: user.id,
    details: `Senha do usuário ${user.name} (${user.email}) foi alterada`,
    ipAddress,
  });

  return { success: true };
}

export async function updateUserPermissions(
  id: string,
  permissions: { permissionId: string; granted: boolean }[],
  actorId?: string | null,
  ipAddress?: string | null
) {
  // Substituir transacionalmente as permissões customizadas do usuário
  await prisma.$transaction(async (tx) => {
    await tx.userPermission.deleteMany({
      where: { userId: id },
    });

    if (permissions.length > 0) {
      await tx.userPermission.createMany({
        data: permissions.map((p) => ({
          userId: id,
          permissionId: p.permissionId,
          granted: p.granted,
        })),
      });
    }
  });

  await logAuditEvent({
    userId: actorId || null,
    action: "CHANGE_PERMISSIONS",
    entity: "User",
    entityId: id,
    details: `Permissões individuais do usuário (${id}) atualizadas. Total de regras: ${permissions.length}`,
    ipAddress,
  });

  return { success: true, count: permissions.length };
}
