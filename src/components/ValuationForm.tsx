import React, { useState, useEffect } from 'react';
import { currencies } from '../lib/currencies';
import { StockSearch } from './StockSearch';
import { ScenarioInputs } from './ScenarioInputs';
import type { ValuationMethod, ValuationInputs, Currency, ValuationResult, Scenario, ScenarioConfig } from '../types';

interface Props {
  activeMethod: ValuationMethod;
  setActiveMethod: (method: ValuationMethod) => void;
  onCalculate: (inputs: ValuationInputs) => void;
  onClear: () => void;
  currentResults: Record<ValuationMethod, ValuationResult | null>;
}

const defaultScenarioInputs: Record<Scenario, ScenarioConfig> = {
  pessimistic: {
    estimatedGrowth: 10,
    desiredCagr: 12,
    terminalMultiple: 12
  },
  neutral: {
    estimatedGrowth: 15,
    desiredCagr: 12,
    terminalMultiple: 15
  },
  optimistic: {
    estimatedGrowth: 20,
    desiredCagr: 12,
    terminalMultiple: 18
  }
};

const defaultInputs: ValuationInputs = {
  stockName: '',
  currentPrice: 0,
  metricValue: 0,
  estimatedGrowth: 15,
  desiredCagr: 12,
  yearsToProject: 5,
  terminalMultiple: 15,
  currency: currencies[0],
  scenarios: defaultScenarioInputs
};

const methodLabels: Record<ValuationMethod, string> = {
  eps: 'EPS',
  ocf: 'OCF/Action',
  fcf: 'FCF/Action'
};

export function ValuationForm({ activeMethod, setActiveMethod, onCalculate, onClear, currentResults }: Props) {
  const [inputs, setInputs] = useState<ValuationInputs>(() => {
    const storedValuation = localStorage.getItem('selectedValuation');
    if (storedValuation) {
      const valuation = JSON.parse(storedValuation);
      const activeValuation = valuation.valuations[activeMethod];
      if (activeValuation) {
        return activeValuation.inputs;
      }
    }
    return defaultInputs;
  });

  // État pour stocker les valeurs de chaque métrique et multiple par méthode
  const [metricValues, setMetricValues] = useState<Record<ValuationMethod, number>>(() => ({
    eps: currentResults.eps?.inputs.metricValue || 0,
    ocf: currentResults.ocf?.inputs.metricValue || 0,
    fcf: currentResults.fcf?.inputs.metricValue || 0
  }));

  const [terminalMultiples, setTerminalMultiples] = useState<Record<ValuationMethod, number>>(() => ({
    eps: currentResults.eps?.inputs.terminalMultiple || 15,
    ocf: currentResults.ocf?.inputs.terminalMultiple || 15,
    fcf: currentResults.fcf?.inputs.terminalMultiple || 15
  }));

  const [enableScenarios, setEnableScenarios] = useState(false);

  useEffect(() => {
    const storedValuation = localStorage.getItem('selectedValuation');
    if (storedValuation) {
      const valuation = JSON.parse(storedValuation);
      const activeValuation = valuation.valuations[activeMethod];
      if (activeValuation) {
        setInputs(activeValuation.inputs);
      }
    }
  }, [activeMethod]);

  // Mettre à jour inputs quand on change de méthode
  useEffect(() => {
    setInputs(prev => ({
      ...prev,
      metricValue: metricValues[activeMethod],
      terminalMultiple: terminalMultiples[activeMethod]
    }));
  }, [activeMethod, metricValues, terminalMultiples]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculationInputs = {
      ...inputs,
      scenarios: enableScenarios ? inputs.scenarios : undefined
    };
    onCalculate(calculationInputs);
    
    // Mettre à jour les valeurs stockées
    setMetricValues(prev => ({
      ...prev,
      [activeMethod]: inputs.metricValue
    }));
    setTerminalMultiples(prev => ({
      ...prev,
      [activeMethod]: inputs.terminalMultiple
    }));
  };

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof ValuationInputs
  ) => {
    const value = e.target.value === '' ? 0 : Number(e.target.value);
    if (!isNaN(value)) {
      if (field === 'metricValue') {
        setMetricValues(prev => ({
          ...prev,
          [activeMethod]: value
        }));
      } else if (field === 'terminalMultiple') {
        setTerminalMultiples(prev => ({
          ...prev,
          [activeMethod]: value
        }));
      }
      setInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleScenarioChange = (scenario: Scenario, updates: Partial<ScenarioConfig>) => {
    setInputs(prev => ({
      ...prev,
      scenarios: {
        ...prev.scenarios!,
        [scenario]: {
          ...prev.scenarios![scenario],
          ...updates
        }
      }
    }));
  };

  const handleTextInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof ValuationInputs
  ) => {
    setInputs(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCurrency = currencies.find(c => c.code === e.target.value) || currencies[0];
    setInputs(prev => ({ ...prev, currency: selectedCurrency }));
  };

  const resetMethodValues = () => {
    setMetricValues({
      eps: 0,
      ocf: 0,
      fcf: 0
    });
    setTerminalMultiples({
      eps: 15,
      ocf: 15,
      fcf: 15
    });
  };

  const handleMarketData = (data: Partial<ValuationInputs>) => {
    // Réinitialiser les valeurs spécifiques à chaque méthode
    resetMethodValues();
    
    setInputs(prev => ({
      ...prev,
      ...data,
      // Réinitialiser les autres valeurs aux valeurs par défaut
      estimatedGrowth: 15,
      desiredCagr: 12,
      yearsToProject: 5,
      terminalMultiple: 15,
      // Pour EPS, on utilise la valeur de l'API si disponible
      metricValue: activeMethod === 'eps' ? data.metricValue || 0 : 0
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="space-y-6">
        <StockSearch onDataFound={handleMarketData} />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Nom de l'action
            </label>
            <input
              type="text"
              value={inputs.stockName}
              onChange={(e) => handleTextInput(e, 'stockName')}
              className="block w-48 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              placeholder="ex: AAPL"
            />
          </div>

          <div className="flex items-end gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Prix actuel
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.currentPrice || ''}
                onChange={(e) => handleNumberInput(e, 'currentPrice')}
                className="block w-32 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>
            <select
              value={inputs.currency.code}
              onChange={handleCurrencyChange}
              className="h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-white dark:text-white py-0 pl-3 pr-8 text-gray-900 focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors duration-200"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Object.entries(methodLabels).map(([method, label]) => (
            <button
              key={method}
              type="button"
              onClick={() => setActiveMethod(method as ValuationMethod)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeMethod === method
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {method.toUpperCase()}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            {methodLabels[activeMethod]}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={inputs.metricValue || ''}
            onChange={(e) => handleNumberInput(e, 'metricValue')}
            className="block w-32 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enableScenarios"
            checked={enableScenarios}
            onChange={(e) => setEnableScenarios(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="enableScenarios" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Activer les scénarios
          </label>
        </div>

        {enableScenarios ? (
          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(defaultScenarioInputs) as Scenario[]).map((scenario) => (
              <ScenarioInputs
                key={scenario}
                scenario={scenario}
                inputs={inputs.scenarios![scenario]}
                onChange={handleScenarioChange}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Croissance estimée (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={inputs.estimatedGrowth || ''}
                onChange={(e) => handleNumberInput(e, 'estimatedGrowth')}
                className="block w-32 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                CAGR minimum souhaité (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={inputs.desiredCagr || ''}
                onChange={(e) => handleNumberInput(e, 'desiredCagr')}
                className="block w-32 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Années
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={inputs.yearsToProject || ''}
                onChange={(e) => handleNumberInput(e, 'yearsToProject')}
                className="block w-24 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Multiple final
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={inputs.terminalMultiple || ''}
                onChange={(e) => handleNumberInput(e, 'terminalMultiple')}
                className="block w-24 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Calculer la valeur juste
        </button>
      </div>
    </form>
  );
}