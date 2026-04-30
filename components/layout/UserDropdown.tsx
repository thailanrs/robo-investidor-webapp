"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/contexts/UserContext";

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useUser();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const avatarUrl = user.profile?.avatar_url || null;
  const displayName = user.profile?.nome_completo || user.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();
  const userLevel = user.profile?.nivel || "PREMIUM ELITE";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none group rounded-full p-1 pl-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
      >
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{displayName}</span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            {userLevel}
          </span>
        </div>

        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 transition-all duration-300 group-hover:ring-emerald-400">
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
          <div className="absolute right-0 mt-2 w-full min-w-[160px] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl rounded-xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-zinc-100/50 dark:border-zinc-800/50">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{displayName}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
            </div>
            <div className="py-2">
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
