export function calculatePotentialCAGR(
  currentPrice: number,
  futurePrice: number,
  years: number
): number {
  return ((Math.pow(futurePrice / currentPrice, 1 / years) - 1) * 100);
}

export function calculateTerminalPrice(
  baseMetric: number,
  growthRate: number,
  terminalMultiple: number,
  years: number
): number {
  // 1. Projeter la métrique (EPS/OCF/FCF) dans le futur
  const futureMetric = baseMetric * Math.pow(1 + growthRate / 100, years);
  // 2. Appliquer le multiple terminal pour obtenir le prix futur
  return futureMetric * terminalMultiple;
}