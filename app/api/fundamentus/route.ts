import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type StockData = {
  ticker: string;
  pl: number;
  evEbit: number;
  mrgLiq: number;
  roe: number;
  liq2Meses: number;
};

// Radicais de empresas do setor financeiro informados
const FINANCIAL_RADICALS = ['ABCB', 'B3SA', 'BBAS', 'BBDC', 'BBSE', 'BPAC', 'ITSA', 'ITUB', 'SANB'];

/**
 * Converte strings do padrão brasileiro para float.
 * Ex: '1.000,50' -> 1000.50 | '15,5%' -> 15.5
 */
function parseBrNumber(str: string): number {
  if (!str) return 0;
  const cleanStr = str.trim();
  if (cleanStr === '-' || cleanStr === '') return 0;
  
  // Remove pontos de milhar, remove símbolo de porcentagem e troca vírgula por ponto
  const cleaned = cleanStr.replace(/\./g, '').replace(/%/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Aplica o ranking da Fórmula Mágica.
 * Combina o ranking de Valor (menor é melhor) com o ranking de Qualidade (maior é melhor).
 */
function rankMagicFormula(stocks: StockData[], valueIndicator: 'evEbit' | 'pl') {
  // Filtramos empresas com indicadores de valor negativos ou zerados (lucro/EBIT negativo)
  const validStocks = stocks.filter(s => s[valueIndicator] > 0);

  // 1. Rank de Valor (Menor EV/EBIT ou P/L recebe rank 1)
  const sortedByValue = [...validStocks].sort((a, b) => a[valueIndicator] - b[valueIndicator]);
  const valueRank = new Map<string, number>();
  sortedByValue.forEach((s, index) => valueRank.set(s.ticker, index + 1));

  // 2. Rank de Qualidade (Maior ROE recebe rank 1)
  const sortedByQuality = [...validStocks].sort((a, b) => b.roe - a.roe);
  const qualityRank = new Map<string, number>();
  sortedByQuality.forEach((s, index) => qualityRank.set(s.ticker, index + 1));

  // 3. Score Final = Rank de Valor + Rank de Qualidade (Menor Score vence)
  const scoredStocks = validStocks.map(s => {
    const score = (valueRank.get(s.ticker) || 0) + (qualityRank.get(s.ticker) || 0);
    return { ...s, magicScore: score };
  });

  return scoredStocks.sort((a, b) => a.magicScore - b.magicScore);
}

export async function fetchFundamentusData(): Promise<string[]> {
  const response = await fetch('http://fundamentus.com.br/resultado.php', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    next: {
      revalidate: 86400 // Cache de 24 horas no Next.js
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Fundamentus: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  
  const stocks: StockData[] = [];

  // Parseando a tabela do Fundamentus
  $('#resultado tbody tr').each((_, el) => {
    const tds = $(el).find('td');
    if (tds.length >= 20) {
      const ticker = $(tds[0]).text().trim();
      const pl = parseBrNumber($(tds[2]).text());
      const evEbit = parseBrNumber($(tds[10]).text());
      const mrgLiq = parseBrNumber($(tds[13]).text());
      const roe = parseBrNumber($(tds[16]).text());
      const liq2Meses = parseBrNumber($(tds[17]).text());

      stocks.push({ ticker, pl, evEbit, mrgLiq, roe, liq2Meses });
    }
  });

  // 1. Filtros de Qualidade Básicos
  const filteredStocks = stocks.filter(s => 
    s.liq2Meses > 1000000 &&
    s.roe > 10 &&
    s.mrgLiq > 5
  );

  // 2. Separação: Financeiras x Reais
  const isFinancial = (ticker: string) => FINANCIAL_RADICALS.some(radical => ticker.startsWith(radical));
  
  const reais = filteredStocks.filter(s => !isFinancial(s.ticker));
  const financeiras = filteredStocks.filter(s => isFinancial(s.ticker));

  // 3. Aplicação do Ranking da Fórmula Mágica
  // Reais: Melhor EV/EBIT e Melhor ROE
  const rankedReais = rankMagicFormula(reais, 'evEbit');
  
  // Financeiras: Melhor P/L e Melhor ROE
  const rankedFinanceiras = rankMagicFormula(financeiras, 'pl');

  // 4. Seleção do Top X
  const topReais = rankedReais.slice(0, 60);
  const topFinanceiras = rankedFinanceiras.slice(0, 30);

  // 5. Formatação do array final de Tickers com o sufixo '.SA'
  return [
    ...topReais.map(s => `${s.ticker}.SA`),
    ...topFinanceiras.map(s => `${s.ticker}.SA`)
  ];
}

export async function GET() {
  try {
    const resultTickers = await fetchFundamentusData();
    return NextResponse.json(resultTickers);
  } catch (error) {
    console.error('Error fetching/parsing Fundamentus:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}
