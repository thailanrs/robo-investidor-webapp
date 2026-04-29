"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, Briefcase, Wallet, History, Settings, X, PanelLeftClose, PanelLeftOpen, BarChart3, TrendingUp } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: <Home className="w-5 h-5 shrink-0" /> },
        { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
    { href: "/proventos", label: "Proventos", icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
    { href: "/carteira", label: "Meus Ativos", icon: <Briefcase className="w-5 h-5 shrink-0" /> },
    { href: "/carteira/lancamentos", label: "Lançamentos", icon: <Wallet className="w-5 h-5 shrink-0" /> },
    { href: "/historico", label: "Histórico Mensal", icon: <History className="w-5 h-5 shrink-0" /> },
    { href: "/perfil", label: "Meu Perfil", icon: <Settings className="w-5 h-5 shrink-0" /> },
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
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out md:translate-x-0 md:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-64"} w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`h-16 flex items-center border-b border-zinc-200 dark:border-zinc-800 ${collapsed ? "md:justify-center md:px-0 px-6" : "px-6"}`}>
            <Link href="/" className={`flex items-center gap-3 ${collapsed ? "md:justify-center" : ""}`}>
              <div className="bg-emerald-600 p-1.5 rounded-lg flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className={`font-bold text-lg tracking-tight truncate transition-opacity duration-200 ${collapsed ? "md:hidden" : ""}`}>
                Robô Investidor
              </span>
            </Link>
            <button 
              className="ml-auto md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-6 space-y-1 overflow-y-auto ${collapsed ? "md:px-2 px-4" : "px-4"}`}>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  title={collapsed ? link.label : undefined}
                  className={`flex items-center gap-3 rounded-lg transition-colors relative group ${
                    collapsed ? "md:justify-center md:px-0 md:py-2.5 px-3 py-2.5" : "px-3 py-2.5"
                  } ${
                    isActive 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {link.icon}
                  <span className={`transition-opacity duration-200 ${collapsed ? "md:hidden" : ""}`}>
                    {link.label}
                  </span>

                  {/* Tooltip on collapsed hover (desktop only) */}
                  {collapsed && (
                    <span className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      {link.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer with collapse toggle */}
          <div className="border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`hidden md:flex items-center gap-3 w-full py-3 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors ${
                collapsed ? "justify-center px-0" : "px-6"
              }`}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-5 h-5 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-5 h-5 shrink-0" />
                  <span className="text-xs">Recolher</span>
                </>
              )}
            </button>
            <div className={`py-2 text-xs text-center text-zinc-400 dark:text-zinc-600 ${collapsed ? "md:px-1" : "px-4"}`}>
              {collapsed ? "v3" : "v3.0.0"}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
