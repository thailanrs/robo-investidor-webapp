import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AppLayoutClient } from "@/components/layout/AppLayoutClient";
import { UserContextType } from "@/contexts/UserContext";
import { Providers } from "@/components/Providers";

export default async function AuthAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("nome_completo, avatar_url")
    .eq("id", user.id)
    .single();

  const userData: UserContextType = {
    id: user.id,
    email: user.email || "",
    profile: profile || null,
  };

  return (
    <Providers>
      <AppLayoutClient user={userData}>{children}</AppLayoutClient>
    </Providers>
  );
}
