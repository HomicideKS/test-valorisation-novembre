import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useValuations } from '../hooks/useValuations';
import { 
  Calculator, Clock, TrendingUp, Target, BarChart2,
  TrendingDown, ArrowRight, ChevronDown, ChevronUp, Trash2, Loader2
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatting';
import type { ValuationMethod, Scenario } from '../types';
import { useNavigate } from 'react-router-dom';

const scenarioLabels: Record<Scenario, string> = {
  pessimistic: 'Pessimiste',
  neutral: 'Neutre',
  optimistic: 'Optimiste'
};

const scenarioIcons: Record<Scenario, React.ReactNode> = {
  pessimistic: <TrendingDown className="h-4 w-4" />,
  neutral: <ArrowRight className="h-4 w-4" />,
  optimistic: <TrendingUp className="h-4 w-4" />
};

const scenarioColors: Record<Scenario, string> = {
  pessimistic: 'border-red-500 dark:border-red-400',
  neutral: 'border-blue-500 dark:border-blue-400',
  optimistic: 'border-green-500 dark:border-green-400'
};

const methodLabels: Record<ValuationMethod, string> = {
  eps: 'EPS',
  ocf: 'OCF/Action',
  fcf: 'FCF/Action'
};

export function UserProfile() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { savedValuations, deleteValuation } = useValuations();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedValuations, setExpandedValuations] = useState<string[]>([]);

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getValueColor = (value: number) => {
    const baseColor = value >= 0 ? 'text-green-600' : 'text-red-600';
    return `${baseColor} dark:${value >= 0 ? 'text-green-400' : 'text-red-400'}`;
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      await deleteValuation(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const loadValuation = (valuation: any) => {
    localStorage.setItem('selectedValuation', JSON.stringify(valuation));
    navigate('/', { replace: true });
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedValuations(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const sortedValuations = Object.values(savedValuations)
    .filter(v => v && v.timestamp)
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

  return (
    <div className="space-y-6">
      {sortedValuations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Historique des Valorisations
            </h3>
          </div>

          <div className="space-y-6">
            {sortedValuations.map((valuation) => {
              const isExpanded = expandedValuations.includes(valuation.id);
              const averagePrice = Object.values(valuation.valuations)
                .filter(v => v !== null)
                .reduce((acc: number, curr: any) => acc + curr.fairValue, 0) / 
                Object.values(valuation.valuations).filter(v => v !== null).length;
              const safetyMargin = ((averagePrice - valuation.currentPrice) / valuation.currentPrice) * 100;

              return (
                <div key={valuation.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                  {/* Header with company name and timestamp */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {valuation.stockName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(valuation.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => loadValuation(valuation)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Charger
                      </button>
                      {showDeleteConfirm === valuation.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(null);
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={(e) => handleDelete(valuation.id, e)}
                            disabled={deletingId === valuation.id}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {deletingId === valuation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Confirmer'
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(valuation.id);
                          }}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary metrics */}
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Prix au moment de la valorisation
                      </p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(valuation.currentPrice, Object.values(valuation.valuations)[0]?.inputs.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Prix Juste Moyen
                      </p>
                      <p className={`text-xl font-semibold ${getValueColor(safetyMargin)}`}>
                        {formatCurrency(averagePrice, Object.values(valuation.valuations)[0]?.inputs.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Marge de Sécurité
                      </p>
                      <p className={`text-xl font-semibold ${getValueColor(safetyMargin)}`}>
                        {formatPercentage(safetyMargin)}
                      </p>
                    </div>
                  </div>

                  {/* Valuation methods */}
                  {Object.entries(valuation.valuations).map(([method, result]) => {
                    if (!result) return null;
                    
                    return (
                      <div key={method} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-4">
                          <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                            Méthode {methodLabels[method as ValuationMethod]}
                          </h5>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BarChart2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {methodLabels[method as ValuationMethod]} initial: {result.inputs.metricValue}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className={`text-sm ${getValueColor(result.safetyMargin)}`}>
                                Prix Juste: {formatCurrency(result.fairValue, result.inputs.currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className={`text-sm ${getValueColor(result.safetyMargin)}`}>
                                Marge: {formatPercentage(result.safetyMargin)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Croissance: {result.inputs.estimatedGrowth}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Multiple: {result.inputs.terminalMultiple}x
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              CAGR: {result.inputs.desiredCagr}%
                            </p>
                          </div>
                        </div>

                        {result.scenarioResults && (
                          <div className="grid grid-cols-3 gap-4">
                            {Object.entries(result.scenarioResults).map(([scenario, data]) => (
                              <div 
                                key={scenario}
                                className={`p-4 rounded-lg border-2 ${scenarioColors[scenario as Scenario]} bg-white dark:bg-gray-800`}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <span className={scenario === 'pessimistic' ? 'text-red-500 dark:text-red-400' : 
                                                 scenario === 'neutral' ? 'text-blue-500 dark:text-blue-400' :
                                                 'text-green-500 dark:text-green-400'}>
                                    {scenarioIcons[scenario as Scenario]}
                                  </span>
                                  <h6 className="text-sm font-medium text-gray-900 dark:text-white">
                                    {scenarioLabels[scenario as Scenario]}
                                  </h6>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Prix Juste: {formatCurrency(data.fairValue, result.inputs.currency)}
                                  </p>
                                  <p className={`text-sm ${getValueColor(data.safetyMargin)}`}>
                                    Marge: {formatPercentage(data.safetyMargin)}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Croissance: {result.inputs.scenarios![scenario as Scenario].estimatedGrowth}%
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Multiple: {result.inputs.scenarios![scenario as Scenario].terminalMultiple}x
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}