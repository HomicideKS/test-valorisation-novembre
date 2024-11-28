import type { Currency, ValuationInputs } from '../types';

const ALPHA_VANTAGE_API_KEY = 'QWXE5ZFWQG1JQMK4';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const FALLBACK_CURRENCY: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

interface CacheItem {
  data: any;
  timestamp: number;
}

const cache: { [key: string]: CacheItem } = {};

function isValidCache(key: string): boolean {
  const item = cache[key];
  if (!item) return false;
  return Date.now() - item.timestamp < CACHE_DURATION;
}

async function fetchWithCache(url: string): Promise<any> {
  if (isValidCache(url)) {
    return cache[url].data;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data['Note']) {
      throw new Error('Limite de requêtes API atteinte. Veuillez réessayer dans une minute.');
    }

    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    cache[url] = {
      data,
      timestamp: Date.now()
    };

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error('Erreur lors de la récupération des données. Veuillez réessayer.');
  }
}

export async function searchCompanies(query: string) {
  if (!query.trim()) return [];

  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const data = await fetchWithCache(url);
    
    if (!data.bestMatches) {
      return [];
    }

    return data.bestMatches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      currency: match['8. currency'] || 'USD'
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Erreur lors de la recherche. Veuillez réessayer.');
  }
}

export async function fetchMarketData(symbol: string) {
  if (!symbol.trim()) {
    throw new Error('Symbole boursier requis');
  }

  try {
    // Fetch current price
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const quoteData = await fetchWithCache(quoteUrl);
    const globalQuote = quoteData['Global Quote'];

    if (!globalQuote || !globalQuote['05. price']) {
      throw new Error('Prix non disponible pour ce symbole');
    }

    const price = parseFloat(globalQuote['05. price']);

    // Fetch company information
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const overviewData = await fetchWithCache(overviewUrl);

    if (!overviewData || !overviewData.Symbol) {
      throw new Error('Informations non disponibles pour ce symbole');
    }

    // Determine currency
    const currencyCode = overviewData.Currency || FALLBACK_CURRENCY.code;
    const currency: Currency = {
      code: currencyCode,
      symbol: currencyCode === 'EUR' ? '€' : '$',
      name: currencyCode === 'EUR' ? 'Euro' : 'US Dollar'
    };

    // Fetch financial data
    const incomeUrl = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const incomeData = await fetchWithCache(incomeUrl);

    let eps = 0;
    if (incomeData.annualReports && incomeData.annualReports.length > 0) {
      const latestReport = incomeData.annualReports[0];
      if (latestReport.eps) {
        eps = parseFloat(latestReport.eps);
      }
    }

    return {
      symbol,
      name: overviewData.Name || symbol,
      price,
      eps,
      currency,
      sector: overviewData.Sector || 'Non disponible',
      industry: overviewData.Industry || 'Non disponible',
      description: overviewData.Description || 'Aucune description disponible'
    };
  } catch (error) {
    console.error('Market data fetch error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur lors de la récupération des données. Veuillez réessayer.');
  }
}