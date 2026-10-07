export type FundStatus = 'investing' | 'settling' | 'withdrawable';
export type ExpenseKind = 'basic' | 'extra';
export type Expense = { id: string; name: string; date: string; amount: number; kind: ExpenseKind };
export type Notice = { id: string; expenseId: string; revision: string; shown: boolean; read: boolean };
export type Charge = { id: number; won: number; euroCents: number; date: string };
export type CalendarState = { notices: Notice[]; walletEuroCents: number; charges: Charge[]; quote: { id: number; won: number; euroCents: number } | null; nextChargeId: number; demoExpenseId: string; expenses: Expense[]; nextId: number; selectedId: string | null; selectedDate: string; month: string; view: 'calendar' | 'list'; today: string; role: 'leader' | 'participant'; fund: { status: FundStatus; amount: number; reserve: number; product: 'domestic_etf' | 'unknown'; orderSubmitted: boolean; filledDate: string | null } };
export const FUND_LABEL: Record<FundStatus, string> = { investing: '투자 중', settling: '매도 후 결제 대기', withdrawable: '출금 가능' };
export const FUND_DESCRIPTION: Record<FundStatus, string> = { investing: '평가금액이며 아직 쓸 수 없는 돈', settling: '매도는 체결됐지만 아직 출금할 수 없는 돈', withdrawable: '사용 가능한 것으로 설정된 예시 금액' };
// A deliberately bounded demonstration calendar, not a live KRX holiday feed.
export const MARKET = { from: '2026-10-01', to: '2026-11-30', holidays: ['2026-10-09'] };
export const RULE_NOTE = '예상 일정입니다. 실제 출금 가능일은 상품과 계좌 상태에 따라 달라질 수 있어요.';
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function addDays(value: string, days: number): string {
  if (!validDate(value)) throw new Error('Invalid date');
  const parsed = new Date(`${value}T00:00:00Z`); parsed.setUTCDate(parsed.getUTCDate() + days); return parsed.toISOString().slice(0, 10);
}
export function inMarket(value: string) { return validDate(value) && value >= MARKET.from && value <= MARKET.to; }
export function businessDay(value: string) {
  const weekday = new Date(`${value}T00:00:00Z`).getUTCDay();
  return inMarket(value) && weekday !== 0 && weekday !== 6 && !MARKET.holidays.includes(value);
}
export function businessShift(value: string, days: number): string | null {
  if (!inMarket(value)) return null;
  let cursor = value;
  for (let left = Math.abs(days); left > 0;) {
    cursor = addDays(cursor, days < 0 ? -1 : 1);
    if (!inMarket(cursor)) return null;
    if (businessDay(cursor)) left--;
  }
  return cursor;
}
export function salePlan(expense: Expense, fund: CalendarState['fund'], today: string) {
  const unavailable = { prepare: null, settlement: null, warning: '현금화 일정 확인 필요' };
  if (expense.kind === 'basic') return { prepare: null, settlement: null, warning: '' };
  if (fund.product !== 'domestic_etf' || !inMarket(expense.date)) return unavailable;
  let deadline = expense.date;
  while (!businessDay(deadline)) { deadline = addDays(deadline, -1); if (!inMarket(deadline)) return unavailable; }
  const prepare = businessShift(deadline, -2);
  if (!prepare) return unavailable;
  const settlement = businessShift(prepare, 2);
  const actualExpected = fund.filledDate && businessDay(fund.filledDate) ? businessShift(fund.filledDate, 2) : null;
  const needsCheck = today > expense.date || (fund.status === 'investing' && prepare < today) || (fund.status === 'settling' && (!actualExpected || actualExpected > expense.date));
  return { prepare, settlement, warning: needsCheck ? '현금화 일정 확인 필요' : '' };
}
export function available(state: CalendarState, kind: ExpenseKind): number {
  return kind === 'basic' ? 3_200_000 : state.fund.status === 'withdrawable' ? state.fund.amount : 0;
}
export function funding(state: CalendarState, expense: Expense) {
  const capacity = expense.kind === 'basic' ? 3_200_000 : state.fund.amount;
  const planned = state.expenses.filter(item => item.kind === expense.kind && item.id !== expense.id).reduce((sum, item) => sum + item.amount, expense.amount);
  return { available: available(state, expense.kind), shortage: Math.max(0, expense.amount - available(state, expense.kind)), planShortage: Math.max(0, planned - capacity) };
}
export function fundBuckets(state: CalendarState): Record<FundStatus, number> {
  return { investing: state.fund.status === 'investing' ? state.fund.amount : 0, settling: state.fund.status === 'settling' ? state.fund.amount : 0, withdrawable: state.fund.status === 'withdrawable' ? state.fund.amount : 0 };
}
export function reminders(state: CalendarState) {
  if (state.role !== 'leader' || state.fund.status !== 'investing') return [];
  return state.expenses.filter(item => {
    const plan = salePlan(item, state.fund, state.today);
    return plan.prepare && plan.prepare <= state.today && item.date >= state.today;
  });
}
export const initialCalendar: CalendarState = {
  notices: [], walletEuroCents: 0, charges: [], quote: null, nextChargeId: 1, demoExpenseId: 'dinner',
  expenses: [
    { id: 'dinner', name: '파리의 특별한 저녁', date: '2026-10-13', amount: 160_000, kind: 'extra' },
    { id: 'hotel', name: '파리 숙소 잔금', date: '2026-10-12', amount: 800_000, kind: 'basic' },
    { id: 'souvenir', name: '함께 고르는 기념품', date: '2026-10-15', amount: 120_000, kind: 'extra' },
  ], nextId: 1, selectedId: 'dinner', selectedDate: '2026-10-13', month: '2026-10', view: 'calendar', today: '2026-10-07', role: 'leader',
  // The 40,000 reserve is held separately and never enters any of the three fund buckets.
  fund: { status: 'investing', amount: 440_000, reserve: 40_000, product: 'domestic_etf', orderSubmitted: false, filledDate: null },
};
export type Action = { type: 'hydrate'; state: CalendarState } | { type: 'notice-shown'; id: string } | { type: 'notice-read'; id: string } | { type: 'demo-alert'; id: string } | { type: 'demo-fill' } | { type: 'demo-withdraw' } | { type: 'quote'; won: number } | { type: 'confirm-charge'; id: number } | { type: 'cancel-quote' } | { type: 'view'; view: CalendarState['view'] } | { type: 'month'; month: string } | { type: 'date'; date: string } | { type: 'select'; id: string } | { type: 'save'; expense: Omit<Expense, 'id'> & { id?: string } } | { type: 'delete'; id: string } | { type: 'today'; date: string } | { type: 'role'; role: CalendarState['role'] } | { type: 'order' } | { type: 'fill' } | { type: 'withdraw' } | { type: 'product'; product: CalendarState['fund']['product'] } | { type: 'reset' };
function baseReducer(state: CalendarState, action: Action): CalendarState {
  switch (action.type) {
    default: return state;
    case 'view': return { ...state, view: action.view };
    case 'month': return /^\d{4}-\d{2}$/.test(action.month) && validDate(`${action.month}-01`) ? { ...state, month: action.month } : state;
    case 'date': return validDate(action.date) ? { ...state, selectedDate: action.date } : state;
    case 'select': { const expense = state.expenses.find(item => item.id === action.id); return expense ? { ...state, selectedId: expense.id, selectedDate: expense.date } : state; }
    case 'save': {
      const { expense } = action;
      if (!expense.name.trim() || !validDate(expense.date) || !Number.isSafeInteger(expense.amount) || expense.amount <= 0 || !['basic', 'extra'].includes(expense.kind)) return state;
      if (expense.id && !state.expenses.some(item => item.id === expense.id)) return state;
      const saved: Expense = { ...expense, name: expense.name.trim(), id: expense.id ?? `expense-${state.nextId}` };
      return { ...state, expenses: expense.id ? state.expenses.map(item => item.id === saved.id ? saved : item) : [...state.expenses, saved], nextId: expense.id ? state.nextId : state.nextId + 1, selectedId: saved.id, selectedDate: saved.date, month: saved.date.slice(0, 7) };
    }
    case 'delete': return { ...state, expenses: state.expenses.filter(item => item.id !== action.id), selectedId: state.selectedId === action.id ? null : state.selectedId };
    case 'today': return validDate(action.date) ? { ...state, today: action.date } : state;
    case 'role': return { ...state, role: action.role };
    case 'order': return state.fund.status === 'investing' ? { ...state, fund: { ...state.fund, orderSubmitted: true } } : state;
    case 'fill': return state.fund.status === 'investing' && state.fund.product === 'domestic_etf' && businessDay(state.today) ? { ...state, fund: { ...state.fund, status: 'settling', filledDate: state.today } } : state;
    case 'withdraw': return state.fund.status === 'settling' ? { ...state, fund: { ...state.fund, status: 'withdrawable' } } : state;
    case 'product': return state.fund.status === 'investing' ? { ...state, fund: { ...state.fund, product: action.product, orderSubmitted: false } } : state;
    case 'reset': return { ...initialCalendar, notices: [], charges: [], quote: null, expenses: initialCalendar.expenses.map(item => ({ ...item })), fund: { ...initialCalendar.fund } };
  }
}
export function monthCells(month: string) {
  const first = `${month}-01`; const weekday = new Date(`${first}T00:00:00Z`).getUTCDay();
  return Array.from({ length: 42 }, (_, index) => addDays(first, index - weekday));
}
export function moveMonth(month: string, delta: number) {
  const date = new Date(`${month}-01T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + delta); return date.toISOString().slice(0, 7);
}

// Fixed illustrative quote, not a live rate. Store EUR as integer cents.
export const DEMO_RATE = 1600;
export const FX_NOTE = '시연용 환율과 잔액이며 실제 환전이나 카드 충전은 실행되지 않습니다';
export function euroCentsFor(won: number) { return Math.floor(won * 100 / DEMO_RATE); }
export function formatEuro(cents: number) { return `${(cents / 100).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`; }
export function restoreSavedCalendar(raw: string): { state: CalendarState; message: string } {
  const saved = JSON.parse(raw) as { version: number; state: CalendarState & { walletYen?: number } };
  const state = saved.state;
  if (![2, 3].includes(saved.version) || !Array.isArray(state.expenses) || !Array.isArray(state.notices) || !Array.isArray(state.charges) || !validDate(state.today) || !Number.isSafeInteger(state.fund.amount) || state.fund.amount < 0 || !['investing', 'settling', 'withdrawable'].includes(state.fund.status)) throw new Error('Invalid saved state');
  if (saved.version === 3) {
    if (!Number.isSafeInteger(state.walletEuroCents) || state.walletEuroCents < 0) throw new Error('Invalid EUR balance');
    return { state, message: '' };
  }
  if (!Number.isSafeInteger(state.walletYen) || state.walletYen! < 0 || state.charges.some(item => !Number.isSafeInteger(item.won) || item.won < 1)) throw new Error('Invalid legacy balance');
  const refunded = state.charges.reduce((sum, item) => sum + item.won, 0);
  if (!Number.isSafeInteger(state.fund.amount + refunded)) throw new Error('Invalid refund');
  const names: Record<string, string> = { '오사카 특별한 저녁': '파리의 특별한 저녁', '오사카 숙소 잔금': '파리 숙소 잔금' };
  return {
    state: { expenses: state.expenses.map(item => ({ ...item, name: names[item.name] ?? item.name })), nextId: state.nextId, selectedId: state.selectedId, selectedDate: state.selectedDate, month: state.month, view: state.view, today: state.today, role: state.role, fund: { ...state.fund, amount: state.fund.amount + refunded }, notices: state.notices, walletEuroCents: 0, charges: [], quote: null, nextChargeId: state.nextChargeId, demoExpenseId: state.demoExpenseId },
    message: refunded > 0 ? '유로 시연으로 변경했어요. 이전 엔화 충전 시연의 원화는 복원했고, 등록한 일정은 유지했어요.' : '',
  };
}
export function noticeText(expense: Expense) {
  return `${expense.name} ${expense.amount.toLocaleString('ko-KR')}원이 ${Number(expense.date.slice(5, 7))}월 ${Number(expense.date.slice(8))}일에 필요해요. 출금 가능일을 맞추려면 매도 계획을 확인하세요.`;
}
function syncNotices(state: CalendarState): CalendarState {
  const due = reminders(state);
  const notices = state.expenses.flatMap(expense => {
    const old = state.notices.find(item => item.expenseId === expense.id);
    const plan = salePlan(expense, state.fund, state.today);
    if (expense.kind !== 'extra' || !plan.prepare || (!old && !due.some(item => item.id === expense.id))) return [];
    const revision = `${expense.name}/${expense.date}/${expense.amount}/${plan.prepare}`;
    return [{ id: expense.id, expenseId: expense.id, revision, shown: old?.shown ?? false, read: old?.revision === revision ? old.read : false }];
  });
  return { ...state, notices };
}
export function calendarReducer(state: CalendarState, action: Action): CalendarState {
  let next = state;
  switch (action.type) {
    case 'hydrate': return syncNotices(action.state);
    case 'notice-shown': next = { ...state, notices: state.notices.map(item => item.id === action.id ? { ...item, shown: true } : item) }; break;
    case 'notice-read': next = { ...state, notices: state.notices.map(item => item.id === action.id ? { ...item, shown: true, read: true } : item) }; break;
    case 'demo-alert': {
      const expense = state.expenses.find(item => item.id === action.id);
      if (!expense || expense.kind !== 'extra' || state.fund.status !== 'investing') return state;
      const plan = salePlan(expense, state.fund, state.today); if (!plan.prepare) return state;
      next = { ...state, today: plan.prepare, selectedId: expense.id, selectedDate: expense.date, month: expense.date.slice(0, 7), demoExpenseId: expense.id }; break;
    }
    case 'demo-fill': {
      const expense = state.expenses.find(item => item.id === state.demoExpenseId);
      if (!expense || salePlan(expense, state.fund, state.today).prepare !== state.today) return state;
      next = baseReducer(state, { type: 'fill' }); break;
    }
    case 'demo-withdraw': {
      if (state.fund.status !== 'settling' || !state.fund.filledDate) return state;
      const expected = businessShift(state.fund.filledDate, 2); if (!expected) return state;
      // Explicit simulated availability confirmation, never a live account assertion.
      next = { ...state, today: expected, fund: { ...state.fund, status: 'withdrawable' } }; break;
    }
    case 'quote': {
      if (!Number.isSafeInteger(action.won) || action.won <= 0 || action.won > available(state, 'extra') || euroCentsFor(action.won) < 1) return state;
      next = { ...state, quote: { id: state.nextChargeId, won: action.won, euroCents: euroCentsFor(action.won) } }; break;
    }
    case 'cancel-quote': next = { ...state, quote: null }; break;
    case 'confirm-charge': {
      const quote = state.quote;
      if (!quote || quote.id !== action.id || quote.won > available(state, 'extra') || state.charges.some(item => item.id === action.id)) return state;
      next = { ...state, quote: null, nextChargeId: state.nextChargeId + 1, walletEuroCents: state.walletEuroCents + quote.euroCents, fund: { ...state.fund, amount: state.fund.amount - quote.won }, charges: [...state.charges, { ...quote, date: state.today }] }; break;
    }
    default: next = baseReducer(state, action);
  }
  return next === state ? state : syncNotices(next);
}
