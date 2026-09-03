import { Metadata } from "next";
import { LoginForm } from "@/modules/auth/LoginForm";

export const metadata: Metadata = {
  title: "Acesso - CG Construções HelpDesk",
  description: "Autenticação no sistema profissional HelpDesk Pro",
};

export default function LoginPage() {
  return <LoginForm />;
}
