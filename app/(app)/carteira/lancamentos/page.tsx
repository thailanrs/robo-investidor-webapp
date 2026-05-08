"use client";

import React, { useEffect, useState } from "react";
import { TransactionForm, TransactionFormData } from "@/components/TransactionForm";
import { TransactionTable } from "@/components/TransactionTable";
import { Transaction, fetchTransactions, insertTransaction, insertTransactions, updateTransaction, deleteTransaction } from "@/lib/transactions";
import { Loader2, Plus, Upload } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { ImportCSVModal } from "@/components/ImportCSVModal";

export default function LancamentosPage() {
  const user = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchTransactions(user.id);
        setTransactions(data);
      } catch (err: any) {
        console.error("Erro em loadData:", err);
        setError("Erro ao carregar dados: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user.id]);

  const handleAddTransaction = async (formData: TransactionFormData) => {
    const newTx = await insertTransaction({
      ...formData,
      user_id: user.id,
    });

    setTransactions((prev) => [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowForm(false);
  };

  const handleImportCSV = async (newTransactions: any[]) => {
    const txToInsert = newTransactions.map(tx => ({
      ...tx,
      user_id: user.id
    }));
    
    const inserted = await insertTransactions(txToInsert);
    
    setTransactions((prev) => 
      [...inserted, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleUpdateTransaction = async (formData: TransactionFormData) => {
    if (!editingTransaction?.id) return;

    const updated = await updateTransaction(editingTransaction.id, formData);

    setTransactions((prev) =>
      prev.map((tx) => (tx.id === updated.id ? updated : tx))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    setEditingTransaction(null);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
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

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 mt-4">
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportCSV(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-md transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </button>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {showImportCSV && (
        <ImportCSVModal 
          onClose={() => setShowImportCSV(false)} 
          onImport={handleImportCSV} 
        />
      )}

      {/* Form Section */}
      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <TransactionForm
            onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
            initialData={editingTransaction || undefined}
            onCancel={handleCancelForm}
          />
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
          onEdit={handleEditTransaction}
          isDeletingId={isDeletingId}
        />
      </div>
    </div>
  );
}
