import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export interface PermissionItem {
  id: string;
  code: string;
  label: string;
  category: string;
  description: string | null;
}

export interface CategoryPermissions {
  category: string;
  permissions: PermissionItem[];
}

export async function getAllPermissionsGrouped(): Promise<CategoryPermissions[]> {
  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  // Agrupar por categoria em ordem lógica e solicitada
  const categoryOrder = [
    "Chamados",
    "Usuários",
    "Dashboard",
    "Configurações",
    "Relatórios",
    "Integrações",
  ];

  const groupedMap = new Map<string, PermissionItem[]>();
  for (const p of allPermissions) {
    const list = groupedMap.get(p.category) || [];
    list.push(p);
    groupedMap.set(p.category, list);
  }

  const result: CategoryPermissions[] = [];
  for (const cat of categoryOrder) {
    if (groupedMap.has(cat)) {
      result.push({
        category: cat,
        permissions: groupedMap.get(cat)!,
      });
      groupedMap.delete(cat);
    }
  }

  // Qualquer outra categoria restante
  for (const [cat, perms] of groupedMap.entries()) {
    result.push({
      category: cat,
      permissions: perms,
    });
  }

  return result;
}

export async function getUserPermissionsMap(userId: string): Promise<{
  roleName: RoleType;
  permissionCodes: string[];
  overrides: { permissionId: string; code: string; granted: boolean }[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleRef: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      userPermissions: {
        include: { permission: true },
      },
    },
  });

  if (!user) {
    return {
      roleName: RoleType.SOLICITANTE,
      permissionCodes: [],
      overrides: [],
    };
  }

  // ADMIN sempre possui todos os códigos por padrão
  if (user.role === RoleType.ADMIN) {
    const allPerms = await prisma.permission.findMany({ select: { code: true } });
    return {
      roleName: RoleType.ADMIN,
      permissionCodes: allPerms.map((p) => p.code),
      overrides: user.userPermissions.map((up) => ({
        permissionId: up.permissionId,
        code: up.permission.code,
        granted: up.granted,
      })),
    };
  }

  const grantedSet = new Set<string>();

  // Permissões do Role
  if (user.roleRef?.permissions) {
    for (const rp of user.roleRef.permissions) {
      grantedSet.add(rp.permission.code);
    }
  }

  // TI tem permissões padrão de chamados, usuários consulta, e configurações consulta
  if (user.role === RoleType.TI && grantedSet.size === 0) {
    grantedSet.add("chamados.create");
    grantedSet.add("chamados.read");
    grantedSet.add("chamados.update");
    grantedSet.add("users.read");
    grantedSet.add("dashboard.read");
  }

  // Aplicar overrides individuais de UserPermission
  const overrides: { permissionId: string; code: string; granted: boolean }[] = [];
  for (const up of user.userPermissions) {
    overrides.push({
      permissionId: up.permissionId,
      code: up.permission.code,
      granted: up.granted,
    });
    if (up.granted) {
      grantedSet.add(up.permission.code);
    } else {
      grantedSet.delete(up.permission.code);
    }
  }

  return {
    roleName: user.role,
    permissionCodes: Array.from(grantedSet),
    overrides,
  };
}

export async function hasPermission(userId: string, code: string): Promise<boolean> {
  const perms = await getUserPermissionsMap(userId);
  if (perms.roleName === RoleType.ADMIN) return true;
  return perms.permissionCodes.includes(code);
}
