export type ValuationMethod = 'eps' | 'ocf' | 'fcf';
export type Theme = 'light' | 'dark';
export type Scenario = 'pessimistic' | 'neutral' | 'optimistic';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt?: number;
}

export interface ScenarioConfig {
  estimatedGrowth: number;
  desiredCagr: number;
  terminalMultiple: number;
}

export interface ValuationInputs {
  stockName: string;
  currentPrice: number;
  metricValue: number;
  estimatedGrowth: number;
  desiredCagr: number;
  yearsToProject: number;
  terminalMultiple: number;
  currency: Currency;
  scenarios?: {
    pessimistic: ScenarioConfig;
    neutral: ScenarioConfig;
    optimistic: ScenarioConfig;
  };
}

export interface ValuationResult {
  id: string;
  timestamp: number;
  fairValue: number;
  currentPrice: number;
  safetyMargin: number;
  projectedValues: number[];
  years: number[];
  stockName: string;
  inputs: ValuationInputs;
  method: ValuationMethod;
  userId: string;
  scenarioResults?: {
    pessimistic: {
      fairValue: number;
      safetyMargin: number;
      projectedValues: number[];
    };
    neutral: {
      fairValue: number;
      safetyMargin: number;
      projectedValues: number[];
    };
    optimistic: {
      fairValue: number;
      safetyMargin: number;
      projectedValues: number[];
    };
  };
}

export interface CompanyValuation {
  id: string;
  timestamp: number;
  stockName: string;
  currentPrice: number;
  valuations: {
    eps: ValuationResult | null;
    ocf: ValuationResult | null;
    fcf: ValuationResult | null;
  };
  userId: string;
}