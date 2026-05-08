import { createClient } from '@/utils/supabase/server';
import YahooFinance from 'yahoo-finance2';
import { DividendType } from '@/lib/dividends';

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical', 'yahooSurvey'] });

export interface SyncSuggestion {
  ticker: string;
  type: DividendType;
  amount: number;
  quantity: number;
  payment_date: string;
  declared_date?: string;
  last_date_prior?: string;
  rate: number;
}

export async function getDividendSuggestions(userId: string): Promise<SyncSuggestion[]> {
  const supabase = await createClient();

  // 1. Obter todas as transações do usuário
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (txError) throw new Error(`Erro ao buscar transações: ${txError.message}`);
  if (!transactions || transactions.length === 0) return [];

  // 2. Agrupar tickers únicos (filtrando subscrições - final 12)
  const uniqueTickers = Array.from(new Set(
    transactions
      .map(tx => tx.ticker.trim().toUpperCase())
      .filter(ticker => !ticker.endsWith('12'))
  ));

  // 3. Obter os proventos já salvos
  const { data: existingDividends, error: divError } = await supabase
    .from('dividends')
    .select('*')
    .eq('user_id', userId);

  if (divError) throw new Error(`Erro ao buscar proventos: ${divError.message}`);

  const suggestions: SyncSuggestion[] = [];

  // 4. Para cada ticker, calcular posição na Data Com e gerar sugestões
  for (const ticker of uniqueTickers) {
    try {
      // Yahoo Finance precisa do sufixo .SA para ações brasileiras
      const tickerSA = `${ticker}.SA`;
      
      // Encontrar a data da primeira transação para este ticker
      const firstTx = transactions.find(tx => tx.ticker.toUpperCase() === ticker);
      const startDate = firstTx ? firstTx.date : '2000-01-01';

      const chart = await yahooFinance.chart(tickerSA, { 
        period1: startDate,
      });

      const rawDividends = chart.events?.dividends || [];

      for (const d of rawDividends) {
        if (!d.date || !d.amount) continue;

        // Yahoo Finance retorna a data-com/ex-dividend no campo 'date'
        const dataCom = d.date.toISOString().split('T')[0];
        
        // Yahoo Finance não fornece a data exata de pagamento ou declaração
        // Usaremos a data-com como aproximação
        const paymentDate = dataCom; 
        const rate = Number(d.amount);
        
        // Yahoo Finance não especifica o tipo (JCP, Rendimento, etc).
        // Assumimos DIVIDENDO por padrão.
        const dbType: DividendType = 'DIVIDENDO';

        // Calcular posição na Data Com (todas transações até a data com)
        let shares = 0;
        for (const tx of transactions) {
          if (tx.ticker.toUpperCase() === ticker && tx.date <= dataCom) {
            if (tx.type === 'COMPRA') shares += Number(tx.quantity);
            if (tx.type === 'VENDA') shares -= Number(tx.quantity);
          }
        }

        // Se o usuário tinha saldo na Data Com
        if (shares > 0) {
          const expectedAmount = shares * rate;

          // Verificar se já existe (pelo ticker, data de pagamento e tipo)
          const alreadyExists = existingDividends?.some(
            ed => ed.ticker === ticker && ed.payment_date === paymentDate && ed.type === dbType
          );

          if (!alreadyExists) {
            suggestions.push({
              ticker,
              type: dbType,
              amount: Number(expectedAmount.toFixed(2)),
              quantity: Number(shares.toFixed(4)),
              payment_date: paymentDate,
              declared_date: dataCom,
              last_date_prior: dataCom,
              rate
            });
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao sincronizar dividendos para ${ticker}:`, error);
      // Ignora erro específico de um ticker e continua para os próximos
    }
  }

  // Ordenar as sugestões pela data de pagamento mais recente primeiro
  return suggestions.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
}
