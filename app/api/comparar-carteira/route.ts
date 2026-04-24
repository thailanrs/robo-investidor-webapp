import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { tickersUsuario, top15 } = await req.json();

    if (!tickersUsuario || !top15 || top15.length === 0) {
      return NextResponse.json({ success: false, error: "Dados insuficientes para análise." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key do Gemini não configurada.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Formata o top 15 para o prompt
    const top15Formatado = top15.map((acao: any, index: number) => {
      return `${index + 1}. ${acao.Ticker} - Setor: ${acao.Setor}, Nota: ${acao.notaTotal}`;
    }).join('\n');

    const prompt = `Você é um consultor quantitativo. Compare a carteira atual do usuário [TICKERS_USUARIO] com as top 15 ações recomendadas pelo nosso algoritmo [TOP_15]. Diga quais ações da carteira dele já estão no ranking e faça uma análise crítica, sugerindo possíveis trocas de forma objetiva (máximo de 3 parágrafos).

[TICKERS_USUARIO]:
${tickersUsuario}

[TOP_15]:
${top15Formatado}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ success: true, analise: text });

  } catch (error: any) {
    console.error("Erro no Comparador de Carteira:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
