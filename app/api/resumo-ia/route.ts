import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AcaoResumo {
  Ticker: string;
  Setor: string;
  'Cotação Atual': number;
  'P/L': number;
  'EV/EBIT': number;
  'ROE': number;
  'Rentabilidade 5A (%)': number;
  'DY 5A Médio (%)': number;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const body = await req.json();
    const { acoes } = body;

    if (!acoes || !Array.isArray(acoes) || acoes.length === 0) {
      return NextResponse.json({ success: false, error: 'Lista de ações inválida ou vazia.' }, { status: 400 });
    }

    // Seleciona as top 3 ações para o resumo e valida os dados
    const top3 = acoes.slice(0, 3);

    for (const acao of top3) {
      const isValid =
        typeof acao.Ticker === 'string' && acao.Ticker.length > 0 && acao.Ticker.length <= 10 &&
        typeof acao.Setor === 'string' && acao.Setor.length > 0 && acao.Setor.length <= 50 &&
        typeof acao['Cotação Atual'] === 'number' &&
        typeof acao['P/L'] === 'number' &&
        typeof acao['EV/EBIT'] === 'number' &&
        typeof acao['ROE'] === 'number' &&
        typeof acao['Rentabilidade 5A (%)'] === 'number' &&
        typeof acao['DY 5A Médio (%)'] === 'number';

      if (!isValid) {
        return NextResponse.json({
          success: false,
          error: 'Dados de ações inválidos. Certifique-se de que todos os campos obrigatórios estão presentes e no formato correto.'
        }, { status: 400 });
      }
    }

    // Formata os dados das top 3 ações para o modelo
    const dadosFormatados = top3.map((acao: AcaoResumo, index: number) => {
      return `${index + 1}. ${acao.Ticker} (${acao.Setor}): Cotação R$${acao['Cotação Atual']}, P/L ${acao['P/L']}, EV/EBIT ${acao['EV/EBIT']}, ROE ${acao['ROE']}%, Rentabilidade 5A ${acao['Rentabilidade 5A (%)']}%, DY Médio 5A ${acao['DY 5A Médio (%)']}%`;
    }).join('\n');

    const prompt = `Atue como um analista financeiro sênior. Baseado nestes dados quantitativos:\n[DADOS]\n${dadosFormatados}\n\nEscreva um parágrafo curto de 3 linhas resumindo por que essas empresas são boas pagadoras de dividendos e estão descontadas na Fórmula Mágica.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, resumo: text });

  } catch (error: any) {
    console.error('Erro na geração do resumo IA:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
