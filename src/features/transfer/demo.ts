import { INITIAL_BALANCE } from './model';

export const MEETING = {
  name: '우리의 오사카 4박 5일',
  memberCount: 4,
  basicTravelCost: INITIAL_BALANCE,
} as const;
// Informational demo value only; this app never deducts additional experience funds.
export const EXTRA_EXPERIENCE_BUDGET = 440_000;
