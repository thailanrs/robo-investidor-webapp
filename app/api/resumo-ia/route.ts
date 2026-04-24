import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Formata os dados das top 3 ações para o modelo
    const top3 = acoes.slice(0, 3);
    const dadosFormatados = top3.map((acao: any, index: number) => {
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
