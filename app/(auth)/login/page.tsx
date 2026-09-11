import { Metadata } from "next";
import { LoginForm } from "@/modules/auth/LoginForm";

export const metadata: Metadata = {
  title: "Acesso - Chamado",
  description: "Autenticação no sistema profissional HelpDesk Pro",
};

export default function LoginPage() {
  return <LoginForm />;
}
