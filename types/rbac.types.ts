export type Role = "ADMIN" | "TI" | "SOLICITANTE";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  department?: string | null;
}

export interface RbacRule {
  role: Role;
  label: string;
  description: string;
}
