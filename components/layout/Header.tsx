"use client";

import React from "react";
import { Menu } from "lucide-react";
import { UserDropdown } from "./UserDropdown";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8">
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

      <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
