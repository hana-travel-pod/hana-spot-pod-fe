import { router, useLocalSearchParams } from 'expo-router';
import { Button, Copy, Row, ui } from '../components/MobileUI';
import { useCalendar } from '../features/calendar/CalendarProvider';
import { available, formatEuro, FX_NOTE } from '../features/calendar/model';
import { EuroAmount, Shell } from '../features/calendar/UI';
import { formatWon } from '../utils/budget';
export default function Result() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { state } = useCalendar(); const receipt = state.charges.find(item => item.id === Number(id));
  return <Shell title="충전 시연 결과" footer={<Button title="캘린더로 돌아가기" onPress={() => router.dismissTo('/')} />}>
    <Copy tone="title">{receipt ? '충전 완료 (시연)' : '충전 내역을 찾을 수 없어요'}</Copy>
    {receipt && <><EuroAmount label="충전한 유로 금액" cents={receipt.euroCents} /><Row label="사용한 원화" value={formatWon(receipt.won)} /><Row label="처리 기준일" value={receipt.date} /></>}
    <Row label="출금 가능 원화 잔액" value={formatWon(available(state, 'extra'))} /><Row label="시연용 유로 지갑 잔액" value={formatEuro(state.walletEuroCents)} /><Copy tone="small" style={ui.muted}>{FX_NOTE}</Copy>
  </Shell>;
}
