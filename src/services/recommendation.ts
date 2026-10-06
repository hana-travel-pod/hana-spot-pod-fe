import { CategoryId, CandidateItem, RecommendationResult } from '../types';
import { CATALOG } from '../data/catalog';
import { MEETING } from '../data/meeting';
import {
  calcPerPerson,
  calcRemaining,
  calcOverAmount,
  isWithinBudget,
  formatWon,
} from '../utils/budget';

// 추후 서버 AI 추천 API로 교체 가능한 함수
export function getRecommendations(
  categoryId: CategoryId,
  effectiveBudget: number,
): RecommendationResult[] {
  const items = CATALOG.filter(c => c.category === categoryId);

  const affordable = items
    .filter(c => isWithinBudget(c.totalPrice, effectiveBudget))
    .sort((a, b) => b.totalPrice - a.totalPrice); // 예산 내 고가 순

  const overBudget = items
    .filter(c => !isWithinBudget(c.totalPrice, effectiveBudget))
    .sort((a, b) => a.totalPrice - b.totalPrice); // 초과 소액 순

  // 예산 내 최대 2개 + 초과 1개 = 최대 3개 표시
  const selected = [
    ...affordable.slice(0, 2),
    ...overBudget.slice(0, 1),
  ];

  return selected.map(candidate => buildResult(candidate, effectiveBudget));
}

function buildResult(candidate: CandidateItem, budget: number): RecommendationResult {
  const affordable = isWithinBudget(candidate.totalPrice, budget);
  const perPersonAmount = calcPerPerson(candidate.totalPrice);
  const remainingBudget = affordable ? calcRemaining(budget, candidate.totalPrice) : 0;
  const overAmount = affordable ? 0 : calcOverAmount(candidate.totalPrice, budget);

  return {
    candidate,
    perPersonAmount,
    remainingBudget,
    isAffordable: affordable,
    overAmount,
    reason: buildReason(candidate, budget, affordable, remainingBudget, overAmount),
  };
}

function buildReason(
  candidate: CandidateItem,
  budget: number,
  affordable: boolean,
  remainingBudget: number,
  overAmount: number,
): string {
  if (affordable) {
    return (
      `4인 총액 ${formatWon(candidate.totalPrice)}이 사용 한도 ` +
      `${formatWon(budget)} 이내입니다. ` +
      `지출 후 ${formatWon(remainingBudget)}이 남아 ` +
      `${MEETING.memberCount}명이 함께 즐길 수 있습니다.`
    );
  }
  return (
    `4인 총액 ${formatWon(candidate.totalPrice)}이 사용 한도 ` +
    `${formatWon(budget)}를 ${formatWon(overAmount)} 초과합니다.`
  );
}
