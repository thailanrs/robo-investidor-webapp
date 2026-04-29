"use client";

import React, { useEffect, useRef } from "react";
import { Menu, Search, Bell, Settings } from "lucide-react";
import { UserDropdown } from "./UserDropdown";
import Link from "next/link";

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
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">

        {/* SearchBar - Glassmorphism */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-lg relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
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

          <button className="relative text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full p-2 transition-all duration-150">
            <span className="sr-only">Notificações</span>
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
          </button>


          <div className="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" aria-hidden="true" />

          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
