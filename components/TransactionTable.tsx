"use client";

import React from "react";
import { Transaction } from "@/lib/transactions";
import { Trash2 } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  isDeletingId?: string | null;
}

export function TransactionTable({ transactions, onDelete, isDeletingId }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        <p className="text-zinc-500 dark:text-zinc-400">Nenhum lançamento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="px-6 py-4 font-medium">Data</th>
            <th className="px-6 py-4 font-medium">Ativo</th>
            <th className="px-6 py-4 font-medium">Tipo</th>
            <th className="px-6 py-4 font-medium text-right">Qtde</th>
            <th className="px-6 py-4 font-medium text-right">Preço Unit.</th>
            <th className="px-6 py-4 font-medium text-right">Total</th>
            <th className="px-6 py-4 font-medium text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {transactions.map((tx) => {
            const isCompra = tx.type === "COMPRA";
            const total = tx.quantity * tx.unit_price;
            
            return (
              <tr 
                key={tx.id} 
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-zinc-300">
                  {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
                  {tx.ticker}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      isCompra
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    }`}
                  >
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-zinc-300">
                  {tx.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-zinc-300">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.unit_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => tx.id && onDelete(tx.id)}
                    disabled={isDeletingId === tx.id}
                    className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
