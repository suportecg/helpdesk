export type Role = "ADMIN" | "TI" | "SOLICITANTE" | "GESTAO" | (string & {});

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  department?: string | null;
  permissions?: string[];
}

export interface RbacRule {
  role: Role;
  label: string;
  description: string;
}
