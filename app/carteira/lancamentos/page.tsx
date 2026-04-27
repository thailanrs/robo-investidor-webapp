"use client";

import React, { useEffect, useState } from "react";
import { TransactionForm, TransactionFormData } from "@/components/TransactionForm";
import { TransactionTable } from "@/components/TransactionTable";
import { Transaction, fetchTransactions, insertTransaction, deleteTransaction } from "@/lib/transactions";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Plus } from "lucide-react";

export default function LancamentosPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Busca o usuário logado e depois suas transações
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session?.user) {
          setError("Você precisa estar logado para acessar os lançamentos.");
          setIsLoading(false);
          return;
        }

        const user = session.user;

        setUserId(user.id);
        const data = await fetchTransactions(user.id);
        setTransactions(data);
      } catch (err: any) {
        setError("Erro ao carregar dados: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleAddTransaction = async (formData: TransactionFormData) => {
    if (!userId) throw new Error("Usuário não autenticado.");

    const newTx = await insertTransaction({
      ...formData,
      user_id: userId,
    });

    // Atualiza a lista localmente
    setTransactions((prev) => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowForm(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    
    setIsDeletingId(id);
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error && !userId) {
    return (
      <div className="container mx-auto p-6 max-w-5xl mt-10">
        <div className="p-6 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-center">
          <p className="font-medium text-lg mb-2">Acesso Negado</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8 mt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Lançamentos
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gerencie suas notas de corretagem (compras e vendas de ativos).
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Adicionar Transação</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Cancelar
            </button>
          </div>
          <TransactionForm onSubmit={handleAddTransaction} />
        </div>
      )}

      {/* Table Section */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Histórico de Transações
        </h2>
        <TransactionTable 
          transactions={transactions} 
          onDelete={handleDeleteTransaction}
          isDeletingId={isDeletingId}
        />
      </div>
    </div>
  );
}
