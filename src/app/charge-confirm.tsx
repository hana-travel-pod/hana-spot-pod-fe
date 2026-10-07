import { router } from 'expo-router';
import { Button, Copy, Row, ui } from '../components/MobileUI';
import { useCalendar } from '../features/calendar/CalendarProvider';
import { available, DEMO_RATE, FX_NOTE } from '../features/calendar/model';
import { EuroAmount, Shell } from '../features/calendar/UI';
import { formatWon } from '../utils/budget';
export default function Confirm() {
  const { state, dispatch } = useCalendar(); const quote = state.quote;
  if (!quote) return <Shell title="충전 확인"><Copy>확인할 충전 내역이 없어요.</Copy><Button title="캘린더로" onPress={() => router.dismissTo('/')} /></Shell>;
  return <Shell title="최종 확인" footer={<Button title="시연 충전 확정" disabled={quote.won > available(state, 'extra')} onPress={() => { dispatch({ type: 'confirm-charge', id: quote.id }); router.replace({ pathname: '/charge-result', params: { id: String(quote.id) } }); }} />}>
    <Copy tone="title">이 금액으로 충전할까요?</Copy><EuroAmount label="충전할 유로 금액" cents={quote.euroCents} hint={`1 EUR = ${DEMO_RATE.toLocaleString('ko-KR')}원 (시연)`} /><Row label="차감할 원화" value={formatWon(quote.won)} /><Row label="충전 후 원화 잔액" value={formatWon(Math.max(0, available(state, 'extra') - quote.won))} />
    <Copy tone="small" style={ui.muted}>{FX_NOTE}</Copy><Button dark title="금액 다시 입력" onPress={() => { dispatch({ type: 'cancel-quote' }); router.back(); }} />
  </Shell>;
}
