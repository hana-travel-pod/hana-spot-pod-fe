export const MEMBERS = [
  { id: 'leader', name: '모임장' },
  { id: 'member1', name: '참여자 1' },
  { id: 'member2', name: '참여자 2' },
  { id: 'member3', name: '참여자 3' },
] as const;
export type MemberId = typeof MEMBERS[number]['id'];
export type RequestStatus = 'draft' | 'awaiting' | 'all_approved' | 'completed' | 'rejected' | 'cancelled';
export type Approval = 'waiting' | 'approved' | 'rejected';
export interface Draft { purpose: string; recipient: string; amount: string }
export const INITIAL_BALANCE = 3_200_000;
export const DEMO_ACCOUNT = 'DEMO-****-**** (시연용)';
export const DEMO_DRAFT: Draft = { purpose: '오사카 숙소 예약금', recipient: '오사카 숙소 예약 계좌', amount: '800000' };
export interface TransferRequest {
  id: number; purpose: string; recipient: string; amount: number; status: RequestStatus;
  approvals: Record<MemberId, Approval>; processedAt: string | null;
}
export interface TransferState { balance: number; request: TransferRequest | null; nextId: number }
export const initialTransferState: TransferState = { balance: INITIAL_BALANCE, request: null, nextId: 1 };
export function draftError(draft: Draft, balance: number) {
  if (!draft.purpose.trim() || !draft.recipient.trim()) return '이체 목적과 받는 사람을 입력해 주세요.';
  const amount = Number(draft.amount);
  if (!/^\d+$/.test(draft.amount) || !Number.isSafeInteger(amount) || amount < 1) return '1원 이상의 정수 금액을 입력해 주세요.';
  if (amount > balance) return '기본 여행비 잔액보다 큰 금액은 요청할 수 없어요.';
  return '';
}
export function approvalCount(request: TransferRequest) {
  return MEMBERS.filter(member => request.approvals[member.id] === 'approved').length;
}
export type TransferAction =
  | { type: 'create'; draft: Draft }
  | { type: 'send'; id: number; signatureLength: number; verified: boolean }
  | { type: 'approve'; id: number; member: MemberId; signatureLength: number }
  | { type: 'reject'; id: number; member: MemberId }
  | { type: 'cancel'; id: number }
  | { type: 'complete'; id: number; processedAt: string }
  | { type: 'reset' };
export function transferReducer(state: TransferState, action: TransferAction): TransferState {
  if (action.type === 'reset') return { ...initialTransferState, nextId: state.nextId + 1 };
  const request = state.request;
  if (action.type === 'create') {
    if (request && ['draft', 'awaiting', 'all_approved'].includes(request.status)) return state;
    if (draftError(action.draft, state.balance)) return state;
    return { ...state, nextId: state.nextId + 1, request: {
      id: state.nextId, purpose: action.draft.purpose.trim(), recipient: action.draft.recipient.trim(), amount: Number(action.draft.amount), status: 'draft',
      approvals: { leader: 'waiting', member1: 'waiting', member2: 'waiting', member3: 'waiting' }, processedAt: null,
    } };
  }
  if (!request || request.id !== action.id) return state;
  if (action.type === 'send') {
    if (request.status !== 'draft' || !action.verified || action.signatureLength < 12) return state;
    return { ...state, request: { ...request, status: 'awaiting', approvals: { ...request.approvals, leader: 'approved' } } };
  }
  if (action.type === 'cancel') {
    if (!['draft', 'awaiting'].includes(request.status)) return state;
    return { ...state, request: { ...request, status: 'cancelled' } };
  }
  if (action.type === 'complete') {
    if (request.status !== 'all_approved' || approvalCount(request) !== MEMBERS.length || request.amount > state.balance) return state;
    return { ...state, balance: state.balance - request.amount, request: { ...request, status: 'completed', processedAt: action.processedAt } };
  }
  if (request.status !== 'awaiting' || action.member === 'leader' || request.approvals[action.member] !== 'waiting') return state;
  if (action.type === 'reject') return { ...state, request: { ...request, status: 'rejected', approvals: { ...request.approvals, [action.member]: 'rejected' } } };
  if (action.signatureLength < 12) return state;
  const approved = { ...request, approvals: { ...request.approvals, [action.member]: 'approved' as const } };
  return { ...state, request: { ...approved, status: approvalCount(approved) === MEMBERS.length ? 'all_approved' : 'awaiting' } };
}
