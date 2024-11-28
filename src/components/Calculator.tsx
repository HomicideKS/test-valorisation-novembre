import React, { useState, useEffect } from 'react';
import { ValuationForm } from './ValuationForm';
import { Results } from './Results';
import { Methodology } from './Methodology';
import { useValuations } from '../hooks/useValuations';
import { Info } from 'lucide-react';
import type { ValuationMethod, ValuationInputs, ValuationResult, Scenario } from '../types';

export function Calculator() {
  const [activeMethod, setActiveMethod] = useState<ValuationMethod>('eps');
  const [results, setResults] = useState<Record<ValuationMethod, ValuationResult | null>>({
    eps: null,
    ocf: null,
    fcf: null,
  });
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { saveCompanyValuation } = useValuations();

  useEffect(() => {
    const storedValuation = localStorage.getItem('selectedValuation');
    if (storedValuation) {
      const valuation = JSON.parse(storedValuation);
      setResults(valuation.valuations);
      localStorage.removeItem('selectedValuation');
    }
  }, []);

  const calculateFairValue = (inputs: ValuationInputs) => {
    const { 
      metricValue, 
      estimatedGrowth, 
      desiredCagr, 
      yearsToProject, 
      terminalMultiple,
      currentPrice,
      stockName,
      scenarios
    } = inputs;
    
    const calculateScenario = (growth: number, cagr: number, multiple: number) => {
      const projectedValues = Array.from({ length: yearsToProject + 1 }, (_, i) => {
        return metricValue * Math.pow(1 + growth / 100, i);
      });
      
      const finalValue = projectedValues[projectedValues.length - 1] * multiple;
      const fairValue = finalValue / Math.pow(1 + cagr / 100, yearsToProject);
      const safetyMargin = ((fairValue - currentPrice) / currentPrice) * 100;
      
      return { fairValue, safetyMargin, projectedValues };
    };
    
    let result: ValuationResult;
    
    if (scenarios) {
      // Calculate all scenarios
      const scenarioResults = {
        pessimistic: calculateScenario(
          scenarios.pessimistic.estimatedGrowth,
          scenarios.pessimistic.desiredCagr,
          scenarios.pessimistic.terminalMultiple
        ),
        neutral: calculateScenario(
          scenarios.neutral.estimatedGrowth,
          scenarios.neutral.desiredCagr,
          scenarios.neutral.terminalMultiple
        ),
        optimistic: calculateScenario(
          scenarios.optimistic.estimatedGrowth,
          scenarios.optimistic.desiredCagr,
          scenarios.optimistic.terminalMultiple
        )
      };
      
      // Calculate average fair value from all scenarios
      const averageFairValue = (
        scenarioResults.pessimistic.fairValue +
        scenarioResults.neutral.fairValue +
        scenarioResults.optimistic.fairValue
      ) / 3;
      
      const averageSafetyMargin = ((averageFairValue - currentPrice) / currentPrice) * 100;
      
      const years = Array.from({ length: yearsToProject + 1 }, (_, i) => new Date().getFullYear() + i);
      
      result = {
        id: `${stockName}-${activeMethod}-${Date.now()}`,
        timestamp: Date.now(),
        fairValue: averageFairValue,
        currentPrice,
        safetyMargin: averageSafetyMargin,
        projectedValues: scenarioResults.neutral.projectedValues, // Keep neutral for base projection
        years,
        stockName,
        inputs,
        method: activeMethod,
        userId: '',
        scenarioResults
      };
    } else {
      // Calculate base scenario only
      const baseProjection = calculateScenario(estimatedGrowth, desiredCagr, terminalMultiple);
      const years = Array.from({ length: yearsToProject + 1 }, (_, i) => new Date().getFullYear() + i);
      
      result = {
        id: `${stockName}-${activeMethod}-${Date.now()}`,
        timestamp: Date.now(),
        fairValue: baseProjection.fairValue,
        currentPrice,
        safetyMargin: baseProjection.safetyMargin,
        projectedValues: baseProjection.projectedValues,
        years,
        stockName,
        inputs,
        method: activeMethod,
        userId: ''
      };
    }
    
    setResults(prev => ({
      ...prev,
      [activeMethod]: result,
    }));
  };

  const handleSaveValuation = async () => {
    if (!Object.values(results).some(r => r !== null) || !results[activeMethod]?.stockName) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      await saveCompanyValuation(
        results[activeMethod].stockName,
        results[activeMethod].currentPrice,
        results
      );
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setSaveError((err as Error).message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const clearResults = () => {
    setResults({
      eps: null,
      ocf: null,
      fcf: null,
    });
    setSaveError(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <ValuationForm
          activeMethod={activeMethod}
          setActiveMethod={setActiveMethod}
          onCalculate={calculateFairValue}
          onClear={clearResults}
          currentResults={results}
        />
        
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Info className="h-4 w-4" />
              <span>Voir la Méthodologie de Calcul</span>
            </button>
            
            <button
              onClick={handleSaveValuation}
              disabled={!Object.values(results).some(r => r !== null) || isSaving}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder les Valorisations'}
            </button>
          </div>

          {saveError && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {saveError}
            </div>
          )}
        </div>

        <Methodology 
          isOpen={isMethodologyOpen}
          onClose={() => setIsMethodologyOpen(false)}
        />
      </div>
      <Results results={results} activeMethod={activeMethod} />
    </div>
  );
}