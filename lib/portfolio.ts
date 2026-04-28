import { Transaction } from './transactions';

/**
 * Representação da posição consolidada de um ativo na carteira.
 */
export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  avgPrice: number;
  totalInvested: number;
  totalOtherCosts: number;
  balance: number; // quantity × avgPrice
}

/**
 * Motor de cálculo de posição e preço médio.
 * 
 * Regras:
 * - COMPRA: precoMedio ponderado = (qtdAtual × PM + qtdCompra × precoCompra) / (qtdAtual + qtdCompra)
 * - VENDA: reduz quantidade, preço médio NÃO muda
 * - other_costs: acumulados separadamente, não afetam preço médio (conforme ARCHITECTURE.md)
 * - Ativos com quantidade zerada (vendidos totalmente) são filtrados
 */
export function calculatePortfolio(transactions: Transaction[]): PortfolioPosition[] {
  // Agrupar transações por ticker
  const grouped = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const ticker = tx.ticker.toUpperCase();
    if (!grouped.has(ticker)) {
      grouped.set(ticker, []);
    }
    grouped.get(ticker)!.push(tx);
  }

  const positions: PortfolioPosition[] = [];

  for (const [ticker, txs] of grouped) {
    // Ordenar por data cronológica (ascendente) para cálculo correto do PM
    const sorted = [...txs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let quantity = 0;
    let avgPrice = 0;
    let totalOtherCosts = 0;

    for (const tx of sorted) {
      totalOtherCosts += tx.other_costs || 0;

      if (tx.type === 'COMPRA') {
        // Preço médio ponderado
        const totalBefore = quantity * avgPrice;
        const totalNew = tx.quantity * tx.unit_price;
        quantity += tx.quantity;
        avgPrice = quantity > 0 ? (totalBefore + totalNew) / quantity : 0;
      } else {
        // VENDA: reduz quantidade, PM não muda
        quantity -= tx.quantity;
        if (quantity < 0) quantity = 0; // Proteção contra inconsistência
      }
    }

    // Só incluir ativos que ainda possuem posição aberta
    if (quantity > 0) {
      positions.push({
        ticker,
        quantity,
        avgPrice: Math.round(avgPrice * 100) / 100,
        totalInvested: Math.round(quantity * avgPrice * 100) / 100,
        totalOtherCosts: Math.round(totalOtherCosts * 100) / 100,
        balance: Math.round(quantity * avgPrice * 100) / 100,
      });
    }
  }

  // Ordenar por saldo (maior primeiro)
  return positions.sort((a, b) => b.balance - a.balance);
}
