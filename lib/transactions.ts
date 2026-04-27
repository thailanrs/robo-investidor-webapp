import { createClient } from '@/utils/supabase/client';

export type TransactionType = 'COMPRA' | 'VENDA';

export interface Transaction {
  id?: string;
  user_id: string;
  ticker: string;
  type: TransactionType;
  quantity: number;
  unit_price: number;
  date: string;
  created_at?: string;
}

export async function fetchTransactions(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar transações: ${error.message}`);
  }

  return data as Transaction[];
}

export async function insertTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select();

  if (error) {
    throw new Error(`Erro ao inserir transação: ${error.message}`);
  }

  return data?.[0] as Transaction;
}

export async function deleteTransaction(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar transação: ${error.message}`);
  }
}
