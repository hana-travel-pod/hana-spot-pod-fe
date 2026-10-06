const realizedAmount = 480_000;
const reserveFund = 40_000;
const confirmedProfit = 80_000;
const investmentPrincipal = 400_000;

export const MEETING = {
  name: '우리의 오사카 4박 5일',
  memberCount: 4,
  destination: '일본 오사카',
  basicTravelCost: 3_200_000,
  investmentPrincipal,
  realizedAmount,
  confirmedProfit,
  reserveFund,
} as const;

export const BUDGET = {
  profitOnly: confirmedProfit,                   // 80,000
  maxAvailable: realizedAmount - reserveFund,    // 440,000
  minAmount: 1,
} as const;
