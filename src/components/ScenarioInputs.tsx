import React from 'react';
import { Scenario, ScenarioConfig } from '../types';

interface Props {
  scenario: Scenario;
  inputs: ScenarioConfig;
  onChange: (scenario: Scenario, updates: Partial<ScenarioConfig>) => void;
  className?: string;
}

const scenarioColors: Record<Scenario, string> = {
  pessimistic: 'border-red-500 dark:border-red-400',
  neutral: 'border-blue-500 dark:border-blue-400',
  optimistic: 'border-green-500 dark:border-green-400'
};

const scenarioLabels: Record<Scenario, string> = {
  pessimistic: 'Pessimiste',
  neutral: 'Neutre',
  optimistic: 'Optimiste'
};

export function ScenarioInputs({ scenario, inputs, onChange, className = '' }: Props) {
  return (
    <div className={`p-4 rounded-lg border-2 ${scenarioColors[scenario]} ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{scenarioLabels[scenario]}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Croissance estimée (%)
          </label>
          <input
            type="number"
            value={inputs.estimatedGrowth}
            onChange={(e) => onChange(scenario, { estimatedGrowth: Number(e.target.value) })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CAGR souhaité (%)
          </label>
          <input
            type="number"
            value={inputs.desiredCagr}
            onChange={(e) => onChange(scenario, { desiredCagr: Number(e.target.value) })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Multiple final
          </label>
          <input
            type="number"
            value={inputs.terminalMultiple}
            onChange={(e) => onChange(scenario, { terminalMultiple: Number(e.target.value) })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}