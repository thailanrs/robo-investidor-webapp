import YahooFinance from 'yahoo-finance2';

// Configuração para suprimir alertas de depreciação de rotas do Yahoo que não afetam a funcionalidade
const yahooFinance = new YahooFinance({ 
  suppressNotices: ['ripHistorical', 'yahooSurvey'] 
});

// Dicionários para traduzir o Setor e a Indústria do Yahoo Finance (Inglês) para o Português
const SECTOR_TRANSLATIONS: Record<string, string> = {
  'Financial Services': 'Serviços Financeiros',
  'Energy': 'Energia',
  'Basic Materials': 'Materiais Básicos',
  'Industrials': 'Indústrias',
  'Consumer Defensive': 'Consumo Defensivo',
  'Consumer Cyclical': 'Consumo Cíclico',
  'Healthcare': 'Saúde',
  'Technology': 'Tecnologia',
  'Communication Services': 'Comunicações',
  'Utilities': 'Utilidade Pública',
  'Real Estate': 'Imobiliário'
};

const INDUSTRY_TRANSLATIONS: Record<string, string> = {
  'Banks—Regional': 'Bancos Regionais',
  'Banks—Diversified': 'Bancos Diversificados',
  'Oil & Gas Integrated': 'Petróleo e Gás Integrado',
  'Oil & Gas E&P': 'Exploração de Petróleo e Gás',
  'Utilities—Regulated Electric': 'Energia Elétrica',
  'Utilities—Regulated Water': 'Saneamento',
  'Telecom Services': 'Serviços de Telecomunicações',
  'Insurance—Life': 'Seguros de Vida',
  'Steel': 'Siderurgia',
  'Packaged Foods': 'Alimentos Embalados'
};

export type AnaliseAtivoResult = {
  Ticker: string;
  Setor: string;
  Industria: string;
  "Cotação Atual": number;
  "P/L": number;
  "EV/EBIT": number;
  "ROE": number;
  "Rentabilidade 5A (%)": number;
  "DY Atual (%)": number;
  "DY 5A Médio (%)": number;
} | null;

/**
 * Analisa a viabilidade e os múltiplos de um ativo usando dados do Yahoo Finance.
 * Regras:
 * - Histórico de 5 anos (mín. 1150 dias úteis).
 * - Rentabilidade em 5 anos > 0%.
 * - DY Médio de 5 anos entre 6.0% e 25.0%.
 */
export async function analisarAtivo(ticker: string): Promise<AnaliseAtivoResult> {
  const formattedTicker = ticker.includes('.') ? ticker : `${ticker}.SA`;
  try {
    const today = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(today.getFullYear() - 5);

    // 1. Busca do Histórico (Preços + Dividendos)
    // O YahooFinance.chart() é o sucessor moderno do historical() na v3 da biblioteca
    const chart = await yahooFinance.chart(formattedTicker, { 
      period1: fiveYearsAgo, 
      period2: today, 
      interval: '1d' 
    });

    const quotes = chart.quotes || [];
    
    // Verificação de Histórico (aprox. 1150 dias úteis em 5 anos)
    if (quotes.length < 1150) {
      return null;
    }

    // 2. Cálculo da Rentabilidade Longo Prazo
    const price5YearsAgo = quotes[0]?.adjclose || quotes[0]?.close;
    const currentPrice = quotes[quotes.length - 1]?.adjclose || quotes[quotes.length - 1]?.close;

    if (!price5YearsAgo || !currentPrice) return null;

    const rentabilidade5A = ((currentPrice / price5YearsAgo) - 1) * 100;
    if (rentabilidade5A <= 0) {
      return null;
    }

    // 3. Cálculo do Dividend Yield Médio de 5 Anos
    const divs = chart.events?.dividends || [];
    
    // Calcula a soma total dos dividendos pagos no período
    const totalDividends = divs.reduce((acc, div) => acc + (div.amount || 0), 0);
    
    // Média anual de dividendos
    const avgYearlyDividend = totalDividends / 5;
    
    // DY Médio projetado pelo preço atual
    const dyMedio5A = (avgYearlyDividend / currentPrice) * 100;

    if (dyMedio5A < 6.0 || dyMedio5A > 25.0) {
      return null; // Fora da margem de segurança de Barsi / Décio Bazin
    }

    // 4. Extração de Múltiplos e Setor
    const quote = await yahooFinance.quoteSummary(formattedTicker, { 
      modules: ['summaryProfile', 'summaryDetail', 'defaultKeyStatistics', 'financialData'] 
    });

    const sectorEn = quote.summaryProfile?.sector || 'Desconhecido';
    const industryEn = quote.summaryProfile?.industry || 'Desconhecido';
    
    const setor = SECTOR_TRANSLATIONS[sectorEn] || sectorEn;
    const industria = INDUSTRY_TRANSLATIONS[industryEn] || industryEn;
    
    const pl = quote.summaryDetail?.trailingPE || 0;
    
    // enterpriseToEbitda é o padrão mais comum retornado pela API do Yahoo na falta de EBIT
    const evEbit = quote.defaultKeyStatistics?.enterpriseToEbitda || quote.defaultKeyStatistics?.enterpriseToEbit || 0;
    
    const roe = (quote.financialData?.returnOnEquity || 0) * 100;
    const dyAtual = (quote.summaryDetail?.dividendYield || 0) * 100;

    const safeCurrentPrice = Number(currentPrice) || 0;
    const safePl = Number(pl) || 0;
    const safeEvEbit = Number(evEbit) || 0;
    const safeRoe = Number(roe) || 0;
    const safeRentabilidade5A = Number(rentabilidade5A) || 0;
    const safeDyAtual = Number(dyAtual) || 0;
    const safeDyMedio5A = Number(dyMedio5A) || 0;

    return {
      Ticker: ticker,
      Setor: setor,
      Industria: industria,
      "Cotação Atual": Number(safeCurrentPrice.toFixed(2)),
      "P/L": Number(safePl.toFixed(2)),
      "EV/EBIT": Number(safeEvEbit.toFixed(2)),
      "ROE": Number(safeRoe.toFixed(2)),
      "Rentabilidade 5A (%)": Number(safeRentabilidade5A.toFixed(2)),
      "DY Atual (%)": Number(safeDyAtual.toFixed(2)),
      "DY 5A Médio (%)": Number(safeDyMedio5A.toFixed(2)),
    };

  } catch (error: any) {
    // Retorna null silenciosamente em caso de ativos não encontrados/delistados
    return null;
  }
}
