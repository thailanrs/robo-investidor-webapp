export interface BrapiQuote {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketDayRange: string;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  marketCap: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  averageDailyVolume10Day: number;
  averageDailyVolume3Month: number;
  fiftyTwoWeekLowChange: number;
  fiftyTwoWeekLowChangePercent: number;
  fiftyTwoWeekRange: string;
  fiftyTwoWeekHighChange: number;
  fiftyTwoWeekHighChangePercent: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  twoHundredDayAverage: number;
  twoHundredDayAverageChange: number;
  twoHundredDayAverageChangePercent: number;
}

export interface BrapiQuoteResponse {
  results: BrapiQuote[];
  requestedAt: string;
  took: string;
}

export interface AssetListItem {
  stock: string;
  name: string;
  type: 'stock' | 'fund' | 'bdr' | 'etf';
  sector: string | null;
}

export interface OHLCVDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoryResponse {
  ticker: string;
  range: string;
  interval: string;
  data: OHLCVDataPoint[];
  stale: boolean;
}

export interface DividendRecord {
  paymentDate: string;
  rate: number;
  type: 'DIVIDENDO' | 'JCP' | 'RENDIMENTO';
  relatedTo: string;
  declaredDate: string;
  lastDatePrior: string;
}

export interface FundamentalsData {
  priceEarnings: number | null;
  earningsPerShare: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  revenuePerShare: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
}

export interface CurrencyRate {
  pair: string;
  bidPrice: number;
  percentChange: number;
  updatedAtDate: string;
}

export interface MacroPrimeRate {
  name: string;
  value: number;
  unit: string;
  effectiveDate: string;
}

export interface MacroOverview {
  currencies: CurrencyRate[];
  rates: MacroPrimeRate[];
  stale: boolean;
}
