import React, { useState } from 'react';
import { Trash2, RefreshCw, Loader2 } from 'lucide-react';
import type { CompanyValuation } from '../types';

interface Props {
  valuations: Record<string, CompanyValuation>;
  onDelete: (id: string) => Promise<void>;
  onLoad: (valuation: CompanyValuation) => void;
}

export function SavedValuations({ valuations, onDelete, onLoad }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = (valuation: CompanyValuation) => {
    try {
      setLoadingId(valuation.id);
      onLoad(valuation);
    } finally {
      setLoadingId(null);
    }
  };

  const sortedValuations = Object.values(valuations).sort((a, b) => {
    const getTime = (timestamp: any) => {
      if (!timestamp) return 0;
      return timestamp.seconds ? timestamp.seconds * 1000 : timestamp;
    };
    return getTime(b.timestamp) - getTime(a.timestamp);
  });

  if (sortedValuations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Évaluations Sauvegardées
      </h2>
      
      <div className="space-y-4">
        {sortedValuations.map((valuation) => (
          <div
            key={valuation.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {valuation.stockName}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {formatDate(valuation.timestamp)}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 grid grid-cols-3 gap-2">
                <span>EPS: {formatCurrency(valuation.valuations?.eps?.fairValue)}</span>
                <span>OCF: {formatCurrency(valuation.valuations?.ocf?.fairValue)}</span>
                <span>FCF: {formatCurrency(valuation.valuations?.fcf?.fairValue)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleLoad(valuation)}
                disabled={loadingId === valuation.id}
                className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Charger l'évaluation"
              >
                <RefreshCw className={`h-5 w-5 ${loadingId === valuation.id ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => handleDelete(valuation.id)}
                disabled={deletingId === valuation.id}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Supprimer l'évaluation"
              >
                {deletingId === valuation.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}