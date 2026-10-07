import { useState } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { Button, Copy, Row, ui } from '../components/MobileUI';
import { useCalendar } from '../features/calendar/CalendarProvider';
import { available, DEMO_RATE, formatEuro, FX_NOTE, euroCentsFor } from '../features/calendar/model';
import { EuroAmount, Shell, styles } from '../features/calendar/UI';
import { formatWon } from '../utils/budget';
export default function Travelog() {
  const { state, dispatch } = useCalendar(); const [input, setInput] = useState('');
  const won = Number(input); const balance = available(state, 'extra');
  const valid = Number.isSafeInteger(won) && won > 0 && won <= balance && euroCentsFor(won) >= 1;
  return <Shell title="환전·충전 시연" footer={<Button title="충전 내용 확인" disabled={!valid} onPress={() => { dispatch({ type: 'quote', won }); router.push('/charge-confirm'); }} />}>
    <Copy tone="title">프랑스 여행을{'\n'}유로로 준비해요</Copy><Row label="출금 가능 원화" value={formatWon(balance)} /><Row label="선택 통화" value="유로 EUR" /><Row label="시연용 환율" value={`1 EUR = ${DEMO_RATE.toLocaleString('ko-KR')}원`} />
    <Copy tone="label">충전할 원화 금액</Copy><TextInput accessibilityLabel="충전할 원화 금액" keyboardType="number-pad" value={input} onChangeText={value => setInput(value.replace(/\D/g, ''))} maxLength={9} placeholder="원화 금액 입력" style={styles.input} />
    <EuroAmount label="환율을 반영한 예상 유로 금액" cents={valid ? euroCentsFor(won) : 0} hint={valid ? `${formatWon(won)} ÷ ${DEMO_RATE.toLocaleString('ko-KR')}원 = ${formatEuro(euroCentsFor(won))}` : '금액을 입력하면 환율을 반영해 바로 계산해요.'} /><Copy tone="small" style={ui.muted}>0.01유로 미만은 버립니다. 수수료가 없는 고정 환율 예시입니다.</Copy>
    {input !== '' && !valid && <Copy>출금 가능액 이내에서 0.01유로 이상 충전할 금액을 입력해주세요.</Copy>}
    {balance === 0 && <Copy>현재 충전할 수 있는 출금 가능 자금이 없어요.</Copy>}
    <Copy tone="small" style={ui.muted}>{FX_NOTE}</Copy>
  </Shell>;
}
