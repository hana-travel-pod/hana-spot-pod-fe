import { router } from 'expo-router';
import { Button, Copy, Row, ui } from '../components/MobileUI';
import { useCalendar } from '../features/calendar/CalendarProvider';
import { businessShift, FUND_LABEL, salePlan } from '../features/calendar/model';
import { Shell } from '../features/calendar/UI';
export default function Demo() {
  const { state, dispatch, storageError, retryStorage } = useCalendar();
  const expense = state.expenses.find(item => item.id === state.demoExpenseId);
  return <Shell title="개발 전용 시연">
    <Copy tone="label">모임장 계정 고정</Copy><Copy tone="small" style={ui.muted}>실제 금융 거래 없이 내부 날짜와 예시 상태만 변경합니다. 캘린더에서 선택한 추가 경험비 일정을 기준으로 연결됩니다.</Copy>
    <Row label="내부 기준일" value={state.today} /><Row label="자금 상태" value={FUND_LABEL[state.fund.status]} /><Copy>{expense?.name ?? '일정을 선택해주세요'}</Copy>
    <Button title="매도 준비 알림 시점으로" disabled={state.fund.status !== 'investing' || !state.expenses.some(item => item.id === state.selectedId && item.kind === 'extra' && salePlan(item, state.fund, state.today).prepare)} onPress={() => { dispatch({ type: 'demo-alert', id: state.selectedId! }); router.dismissTo('/'); }} />
    <Button title="매도 체결 시연" disabled={state.fund.status !== 'investing' || !expense || salePlan(expense, state.fund, state.today).prepare !== state.today} onPress={() => { dispatch({ type: 'demo-fill' }); router.dismissTo('/'); }} />
    <Button title="출금 가능일 확인 시연" disabled={state.fund.status !== 'settling' || !state.fund.filledDate || !businessShift(state.fund.filledDate, 2)} onPress={() => { dispatch({ type: 'demo-withdraw' }); router.dismissTo('/'); }} />
    <Copy tone="small" style={ui.muted}>출금 가능일 확인은 데모 계좌에서 사용 가능 여부를 확인한 것으로 가정하는 단계입니다. 예상 날짜만으로 실제 출금 가능 상태를 판단하지 않아요.</Copy>
    {storageError && <><Copy>{storageError}</Copy><Button title="저장 재시도" onPress={retryStorage} /></>}
    <Button dark title="데모 초기화" onPress={() => router.push('/reset')} />
  </Shell>;
}
