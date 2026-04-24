import Link from 'next/link';
import { Bot } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Robô Investidor</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
            Dashboard Atual
          </Link>
          <Link href="/historico" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
            Histórico de Meses
          </Link>
        </nav>
      </div>
    </header>
  );
}
