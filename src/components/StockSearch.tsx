import React, { useState, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { fetchMarketData, searchCompanies } from '../lib/market-data';
import type { ValuationInputs } from '../types';
import { useClickAway } from '../hooks/useClickAway';

interface Props {
  onDataFound: (data: Partial<ValuationInputs>) => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export function StockSearch({ onDataFound }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  useClickAway(searchRef, () => setShowResults(false));

  const handleSearch = async (symbol: string) => {
    if (!symbol.trim()) return;

    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const data = await fetchMarketData(symbol);
      if (data) {
        onDataFound({
          stockName: data.name || data.symbol,
          currentPrice: data.price,
          currency: data.currency,
          metricValue: data.eps || 0
        });
        setQuery('');
      }
    } catch (err: any) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setError(null);

    if (value.length >= 2) {
      setLoading(true);
      try {
        const results = await searchCompanies(value);
        setSearchResults(results);
        setShowResults(true);
      } catch (err: any) {
        console.error('Erreur lors de la recherche:', err);
        setError(err.message || 'Erreur lors de la recherche');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    handleSearch(result.symbol);
  };

  return (
    <div className="space-y-2" ref={searchRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Entrez un symbole boursier (ex: AAPL)"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.symbol}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {result.region}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {result.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Recherche...</span>
            </>
          ) : (
            <span>Rechercher</span>
          )}
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Données fournies par Alpha Vantage (mises en cache pendant 5 minutes)
      </p>
    </div>
  );
}