import React from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = {
  title: "Meu Perfil | Robô Investidor",
  description: "Gerencie suas configurações e dados pessoais.",
};

export default function PerfilPage() {
  return (
    <div className="container max-w-4xl py-6 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Meu Perfil
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Gerencie suas informações pessoais e credenciais de acesso.
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
