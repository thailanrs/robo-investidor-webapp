import { NextResponse } from 'next/server';
import { fetchFundamentusData } from '../fundamentus/route';
import { analisarAtivo, AnaliseAtivoResult } from '@/lib/yahooFinanceService';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Permite que a API Vercel rode por até 60s (necessário para múltiplos fetches)

type TickerResult = Exclude<AnaliseAtivoResult, null> & {
  magicFormulaRank: number;
  dyRank?: number;
  notaTotal?: number;
};

export async function GET() {
  try {
    const supabaseUser = await createServerClient();
    // 1. Obtém os 90 tickers preliminares da Fórmula Mágica (Fundamentus)
    const tickers = await fetchFundamentusData();
    
    if (!tickers || tickers.length === 0) {
      throw new Error("Nenhum ticker retornado do Fundamentus");
    }

    // 2. Executa a análise profunda do Yahoo Finance em paralelo (com limite para não estourar memória, mas allSettled é seguro)
    const promises = tickers.map(async (ticker, index) => {
      const result = await analisarAtivo(`${ticker}.SA`);
      if (result) {
        result.Ticker = ticker; // Remove o '.SA' do ticker para exibição limpa na UI
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

    // 3. Filtra apenas os sucessos válidos
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

    // 8. Gerar Insight de Especialista com IA (Gemini)
    let resumoIA = "";
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && finalistas.length > 0) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const top3 = finalistas.slice(0, 3);
        const dadosFormatados = top3.map((acao: any, index: number) => {
          return `${index + 1}. ${acao.Ticker} (${acao.Setor}): Cotação R$${acao['Cotação Atual']}, P/L ${acao['P/L']}, EV/EBIT ${acao['EV/EBIT']}, ROE ${acao['ROE']}%, Rentabilidade 5A ${acao['Rentabilidade 5A (%)']}%, DY Médio 5A ${acao['DY 5A Médio (%)']}%`;
        }).join('\n');

        const prompt = `Atue como um analista financeiro sênior. Baseado nestes dados quantitativos:\n[DADOS]\n${dadosFormatados}\n\nEscreva um 'Insight de Especialista' de no máximo 2 parágrafos, explicando por que essas empresas são boas escolhas hoje, pagadoras de dividendos e estão descontadas na Fórmula Mágica.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        resumoIA = result.response.text();
      }
    } catch (e) {
      console.error("Erro ao gerar resumo IA:", e);
    }

    // 9. Salvar no Histórico do Supabase
    if (finalistas.length > 0) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { error: dbError } = await supabaseAdmin.from('historico_analises').insert([
          { dados_acoes: finalistas, resumo_ia: resumoIA }
        ]);

        if (dbError) {
          console.error("Erro ao salvar no Supabase:", dbError);
        }
      } catch(e) {
        console.error("Erro inesperado ao salvar no Supabase:", e);
      }
    } else {
      console.warn("Nenhum finalista válido foi retornado. Pulando o salvamento no banco de dados.");
    }

    return NextResponse.json({
      success: true,
      data: finalistas,
      resumo_ia: resumoIA
    });

  } catch (error: any) {
    console.error("Erro na orquestração de análise:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
