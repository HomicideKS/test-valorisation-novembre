import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { calculatePotentialCAGR, calculateTerminalPrice } from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatting';
import type { ValuationMethod, ValuationResult, Scenario } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  results: Record<ValuationMethod, ValuationResult | null>;
  activeMethod: ValuationMethod;
}

const methodLabels: Record<ValuationMethod, string> = {
  eps: 'EPS',
  ocf: 'OCF/Action',
  fcf: 'FCF/Action'
};

const scenarioLabels: Record<Scenario, string> = {
  pessimistic: 'Pessimiste',
  neutral: 'Neutre',
  optimistic: 'Optimiste'
};

export function Results({ results, activeMethod }: Props) {
  const result = results[activeMethod];

  const calculateAveragePrice = () => {
    const validResults = Object.values(results).filter(r => r !== null) as ValuationResult[];
    if (validResults.length === 0) return null;
    const sum = validResults.reduce((acc, curr) => acc + curr.fairValue, 0);
    return sum / validResults.length;
  };

  const calculateAverageSafetyMargin = (currentPrice: number) => {
    const averagePrice = calculateAveragePrice();
    if (averagePrice === null) return null;
    return ((averagePrice - currentPrice) / currentPrice) * 100;
  };

  const getValueColor = (value: number) => {
    const baseColor = value >= 0 ? 'text-green-600' : 'text-red-600';
    return `${baseColor} dark:${value >= 0 ? 'text-green-400' : 'text-red-400'}`;
  };

  const getMetricChartData = (result: ValuationResult | null) => {
    if (!result) return null;

    return {
      labels: result.years,
      datasets: [
        {
          label: `${methodLabels[activeMethod]} - Base`,
          data: result.projectedValues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
        ...(result.scenarioResults ? [
          {
            label: 'Pessimiste',
            data: result.scenarioResults.pessimistic.projectedValues,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderDash: [5, 5],
          },
          {
            label: 'Optimiste',
            data: result.scenarioResults.optimistic.projectedValues,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderDash: [5, 5],
          },
        ] : []),
      ],
    };
  };

  const getPriceChartData = (result: ValuationResult | null) => {
    if (!result) return null;

    const currentPrice = result.currentPrice;
    const datasets = [];

    if (result.scenarioResults) {
      Object.entries(result.scenarioResults).forEach(([scenario, data]) => {
        const scenarioColor = scenario === 'pessimistic' ? 'rgb(239, 68, 68)' : 
                            scenario === 'optimistic' ? 'rgb(34, 197, 94)' : 
                            'rgb(59, 130, 246)';
        
        const projectedPrice = calculateTerminalPrice(
          result.inputs.metricValue,
          result.inputs.scenarios![scenario as Scenario].estimatedGrowth,
          result.inputs.scenarios![scenario as Scenario].terminalMultiple,
          result.inputs.yearsToProject
        );
        
        datasets.push({
          label: `Prix Projeté - ${scenarioLabels[scenario as Scenario]}`,
          data: [currentPrice, projectedPrice],
          borderColor: scenarioColor,
          backgroundColor: `${scenarioColor.replace('rgb', 'rgba').replace(')', ', 0.5)')}`,
          borderDash: scenario === 'neutral' ? [] : [5, 5],
        });
      });
    } else {
      const projectedPrice = calculateTerminalPrice(
        result.inputs.metricValue,
        result.inputs.estimatedGrowth,
        result.inputs.terminalMultiple,
        result.inputs.yearsToProject
      );
      datasets.push({
        label: 'Prix Projeté',
        data: [currentPrice, projectedPrice],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      });
    }

    return {
      labels: [new Date().getFullYear(), result.years[result.years.length - 1]],
      datasets,
    };
  };

  const chartOptions = (title: string) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatCurrency(value, result?.inputs.currency || { code: 'EUR', symbol: '€', name: 'Euro' }),
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  });

  const handleDownloadPDF = async () => {
    if (!result?.stockName) return;
    await generatePDF(results, activeMethod, result.stockName);
  };

  const averagePrice = calculateAveragePrice();
  const currency = result?.inputs.currency || { code: 'EUR', symbol: '€', name: 'Euro' };
  const currentPrice = result?.currentPrice;
  const averageSafetyMargin = currentPrice ? calculateAverageSafetyMargin(currentPrice) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Résultats de la Valorisation {result?.stockName && `pour ${result.stockName}`}
          </h2>
          
          {result && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger PDF</span>
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Prix Actuel</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {result ? formatCurrency(result.currentPrice, currency) : '—'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Prix Juste Moyen</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(averagePrice, currency)}
              </p>
            </div>
          </div>

          {averageSafetyMargin !== null && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Marge de Sécurité</h3>
              <p className={`text-3xl font-bold ${getValueColor(averageSafetyMargin)}`}>
                {formatPercentage(averageSafetyMargin)}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Basé sur EPS</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {results.eps ? formatCurrency(results.eps.fairValue, results.eps.inputs.currency) : '—'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Basé sur OCF</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {results.ocf ? formatCurrency(results.ocf.fairValue, results.ocf.inputs.currency) : '—'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Basé sur FCF</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {results.fcf ? formatCurrency(results.fcf.fairValue, results.fcf.inputs.currency) : '—'}
              </p>
            </div>
          </div>

          {result?.scenarioResults && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {Object.entries(result.scenarioResults).map(([scenario, data]) => {
                const terminalPrice = calculateTerminalPrice(
                  result.inputs.metricValue,
                  result.inputs.scenarios![scenario as Scenario].estimatedGrowth,
                  result.inputs.scenarios![scenario as Scenario].terminalMultiple,
                  result.inputs.yearsToProject
                );
                const potentialCagr = calculatePotentialCAGR(
                  result.currentPrice,
                  terminalPrice,
                  result.inputs.yearsToProject
                );

                return (
                  <div key={scenario}>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Scénario {scenarioLabels[scenario as Scenario]}
                    </h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(data.fairValue, result.inputs.currency)}
                    </p>
                    <p className={`text-sm ${getValueColor(data.safetyMargin)}`}>
                      {formatPercentage(data.safetyMargin)}
                    </p>
                    <p className={`text-sm ${getValueColor(potentialCagr)}`}>
                      CAGR Potentiel: {formatPercentage(potentialCagr)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {result && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Projection de Croissance - {methodLabels[activeMethod]}
            </h2>
            <Line options={chartOptions(`Évolution ${methodLabels[activeMethod]}`)} data={getMetricChartData(result)!} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Projection du Prix de l'Action
            </h2>
            <Line options={chartOptions('Évolution du Prix')} data={getPriceChartData(result)!} />
          </div>
        </>
      )}
    </div>
  );
}