import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { UserDropdown } from "./UserDropdown";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Menu button for mobile */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-zinc-700 dark:text-zinc-300 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bell className="h-6 w-6" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">
        {/* SearchBar - Glassmorphism */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar ativos, relatórios ou robôs..."
              className="w-full bg-white/30 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side icons & User */}
        <div className="flex items-center gap-x-2 sm:gap-x-4">
          <Link
            href="/alertas"
            className="relative text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full p-2 transition-all duration-150"
          >
            <span className="sr-only">Alertas de Preço</span>
            <Bell className="h-5 w-5" />
          </Link>

          <div className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" aria-hidden="true" />

          <UserDropdown />
        </div>
      </div>
    </header>
  );
}