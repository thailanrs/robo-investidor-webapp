"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      let authResult = await supabase.auth.getUser();
      
      if (authResult.error?.message?.includes('stole it')) {
        await new Promise(r => setTimeout(r, 500));
        authResult = await supabase.auth.getUser();
      }
      
      const { data: { user } } = authResult;
      if (user) {
        setUser(user);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nome_completo, avatar_url")
          .eq("id", user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
        }
      }
      setIsLoading(false);
    }
    
    loadUser();

    // Setup auth listener
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nome_completo, avatar_url")
          .eq("id", session.user.id)
          .single();
        if (profileData) setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (isLoading) {
    return <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />;
  }

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium hover:text-emerald-500 transition-colors">
        Entrar
      </Link>
    );
  }

  const avatarUrl = profile?.avatar_url || null;
  const displayName = profile?.nome_completo || user.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
      >
        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-300 dark:border-zinc-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{initials}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 rounded-md shadow-lg border border-zinc-200 dark:border-zinc-800 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{displayName}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/perfil"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <User className="w-4 h-4" />
                Meu Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
