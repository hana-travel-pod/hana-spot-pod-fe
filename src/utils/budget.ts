import { MEETING } from '../data/meeting';

export function formatWon(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function calcPerPerson(total: number): number {
  return Math.floor(total / MEETING.memberCount);
}

export function calcRemaining(budget: number, spent: number): number {
  return budget - spent;
}

export function calcOverAmount(total: number, budget: number): number {
  return Math.max(0, total - budget);
}

export function isWithinBudget(total: number, budget: number): boolean {
  return total <= budget;
}
