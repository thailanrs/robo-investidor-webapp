"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, Wallet, History, Settings, Menu, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { href: "/carteira/lancamentos", label: "Lançamentos", icon: <Wallet className="w-5 h-5" /> },
    { href: "/historico", label: "Histórico Mensal", icon: <History className="w-5 h-5" /> },
    { href: "/perfil", label: "Meu Perfil", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-emerald-600 p-1.5 rounded-lg flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight truncate">Robô Investidor</span>
            </Link>
            <button 
              className="ml-auto md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive 
                      ? "bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 font-medium" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer (optional) */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-center text-zinc-500 dark:text-zinc-500">
            v3.0.0
          </div>
        </div>
      </aside>
    </>
  );
}
