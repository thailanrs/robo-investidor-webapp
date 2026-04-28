import { NextResponse } from 'next/server';
import { fetchFundamentusData } from '../fundamentus/route';
import { analisarAtivo, AnaliseAtivoResult } from '@/lib/yahooFinanceService';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 60; // Permite que a API Vercel rode por até 60s (necessário para múltiplos fetches)

type TickerResult = Exclude<AnaliseAtivoResult, null> & {
  magicFormulaRank: number;
  dyRank?: number;
  notaTotal?: number;
};

export async function GET() {
  try {
    const supabase = await createClient();
    // 1. Obtém os 90 tickers preliminares da Fórmula Mágica (Fundamentus)
    const tickers = await fetchFundamentusData();
    
    if (!tickers || tickers.length === 0) {
      throw new Error("Nenhum ticker retornado do Fundamentus");
    }

    // 2. Executa a análise profunda do Yahoo Finance em paralelo (com limite para não estourar memória, mas allSettled é seguro)
    const promises = tickers.map(async (ticker, index) => {
      const result = await analisarAtivo(ticker);
      if (result) {
        // O index representa o Ranking da Fórmula Mágica (já vem ordenado do Fundamentus)
        // Reais (0-59), Financeiras (60-89). Para simplificar, usamos a posição absoluta no array.
        return {
          ...result,
          magicFormulaRank: index + 1
        } as TickerResult;
      }
      return null;
    });

    const settledResults = await Promise.allSettled(promises);

    // 3. Filtra apenas os sucessos válidos (que não retornaram null)
    const validResults: TickerResult[] = settledResults
      .filter((r): r is PromiseFulfilledResult<TickerResult> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    // 4. Ranking de Dividend Yield 5A
    // Ordena do maior DY para o menor para estabelecer o ranking
    validResults.sort((a, b) => b["DY 5A Médio (%)"] - a["DY 5A Médio (%)"]);
    
    validResults.forEach((res, index) => {
      res.dyRank = index + 1;
      // Nota Total: Soma das duas colocações (quanto menor, melhor)
      res.notaTotal = res.magicFormulaRank + res.dyRank;
    });

    // 5. Ordena pela Nota Total (Menor é Melhor)
    validResults.sort((a, b) => (a.notaTotal || 0) - (b.notaTotal || 0));

    // 6. Remoção de Duplicatas ON/PN (Mesmo Radical de 4 letras)
    // Agrupa pelo radical e mantém estritamente aquela com a menor 'Nota Total'
    const uniqueMap = new Map<string, TickerResult>();
    
    for (const res of validResults) {
      const radical = res.Ticker.substring(0, 4); // ex: PETR4 -> PETR
      
      if (!uniqueMap.has(radical)) {
        uniqueMap.set(radical, res);
      } else {
        const existente = uniqueMap.get(radical)!;
        // Mantém a que tiver a melhor (menor) Nota Total
        if ((res.notaTotal || 0) < (existente.notaTotal || 0)) {
          uniqueMap.set(radical, res);
        }
      }
    }

    // 7. Seleciona as 15 Finalistas (garantindo a ordenação final)
    const finalistasAgrupadas = Array.from(uniqueMap.values());
    finalistasAgrupadas.sort((a, b) => (a.notaTotal || 0) - (b.notaTotal || 0));
    const finalistas = finalistasAgrupadas.slice(0, 15);

    // 8. Salvar no Histórico do Supabase
    try {
      const { error: dbError } = await supabase.from('historico_analises').insert([
        { dados_acoes: finalistas, resumo_ia: "" }
      ]);
      
      if (dbError) {
        console.error("Erro ao salvar no Supabase:", dbError);
      }
    } catch(e) {
      console.error("Erro inesperado ao salvar no Supabase:", e);
    }

    return NextResponse.json({
      success: true,
      data: finalistas
    });

  } catch (error: any) {
    console.error("Erro na orquestração de análise:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
