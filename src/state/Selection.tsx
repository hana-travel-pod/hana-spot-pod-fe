import { createContext, useContext, useState, PropsWithChildren } from 'react';
import { BudgetOptionId, CategoryId, RecommendationResult } from '../types';
import { BUDGET } from '../data/meeting';

export const CATEGORIES: { id: CategoryId; label: string; description: string }[] = [
  { id: 'dining', label: '식사', description: '시장 한 끼부터 특별한 코스 요리까지' },
  { id: 'accommodation', label: '숙소 업그레이드', description: '더 넓은 객실에서 여유롭게 쉬어요' },
  { id: 'performance', label: '공연', description: '프랑스의 문화를 만나는 특별한 밤' },
  { id: 'activity', label: '액티비티', description: '직접 만들고, 타고, 도시를 탐험해요' },
  { id: 'shopping', label: '쇼핑', description: '함께 고르는 오래 남을 여행 기념품' },
];
export function resolveBudget(option: BudgetOptionId | null, raw: string) {
  const amount = option === 'profit_only' ? BUDGET.profitOnly : option === 'max_available' ? BUDGET.maxAvailable : Number(raw.replace(/,/g, ''));
  const error = !option ? '사용 범위를 선택해 주세요.' : !Number.isFinite(amount) || amount < 1 ? '1원 이상의 숫자를 입력해 주세요.' : amount > BUDGET.maxAvailable ? '최대 440,000원까지 입력할 수 있어요.' : '';
  return { amount: Number.isFinite(amount) ? amount : 0, error };
}
function useSelectionState() {
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [option, setOption] = useState<BudgetOptionId | null>(null);
  const [customRaw, setCustomRaw] = useState('');
  const [recommendation, setRecommendation] = useState<{ categoryId: CategoryId; amount: number; results: RecommendationResult[] } | null>(null);
  return { categoryId, setCategoryId, option, setOption, customRaw, setCustomRaw, recommendation, setRecommendation };
}
const SelectionContext = createContext<ReturnType<typeof useSelectionState> | null>(null);
export function SelectionProvider({ children }: PropsWithChildren) {
  const value = useSelectionState();
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}
export function useSelection() {
  const value = useContext(SelectionContext);
  if (!value) throw new Error('SelectionProvider is required');
  return value;
}
