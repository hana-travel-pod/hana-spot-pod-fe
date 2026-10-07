import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Copy, palette, ui } from '../../components/MobileUI';
import { useCalendar } from '../../features/calendar/CalendarProvider';
import { ExpenseKind, funding, salePlan, validDate } from '../../features/calendar/model';
import { Segment, Shell, styles } from '../../features/calendar/UI';
import { formatWon } from '../../utils/budget';
export default function Edit() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const { state, dispatch } = useCalendar(); const existing = state.expenses.find(item => item.id === id);
  const [name, setName] = useState(existing?.name ?? ''); const [date, setDate] = useState(existing?.date ?? state.selectedDate); const [amount, setAmount] = useState(existing ? String(existing.amount) : ''); const [kind, setKind] = useState<ExpenseKind>(existing?.kind ?? 'extra');
  const expense = { id: existing?.id ?? 'preview', name, date, amount: Number(amount), kind };
  const error = !name.trim() ? '지출명을 입력해주세요.' : !validDate(date) ? '실제 날짜를 YYYY-MM-DD 형식으로 입력해주세요.' : !Number.isSafeInteger(expense.amount) || expense.amount < 1 ? '1원 이상의 금액을 입력해주세요.' : '';
  const money = funding(state, expense); const plan = salePlan(expense, state.fund, state.today);
  return <Shell title={existing ? '일정 수정' : '일정 등록'} footer={<Button title="일정 저장" disabled={!!error} onPress={() => { dispatch({ type: 'save', expense: { ...expense, id: existing?.id } }); router.dismissTo('/'); }} />}>
    <Copy tone="title">{existing ? '계획을 수정해요' : '쓸 날짜를 알려주세요'}</Copy>
    {[{ label: '지출명', value: name, change: setName, numeric: false }, { label: '지출 예정일', value: date, change: setDate, numeric: false }, { label: '필요한 금액', value: amount, change: setAmount, numeric: true }].map(field => <View key={field.label} style={{ gap: 8 }}><Copy tone="label">{field.label}</Copy><TextInput accessibilityLabel={field.label} style={styles.input} value={field.value} onChangeText={value => field.change(field.numeric ? value.replace(/\D/g, '') : value)} keyboardType={field.numeric ? 'number-pad' : 'default'} maxLength={field.numeric ? 12 : field.label === '지출 예정일' ? 10 : 60} autoCapitalize="none" /></View>)}
    <Copy tone="small" style={ui.muted}>날짜 형식 YYYY-MM-DD</Copy><Segment options={[{ id: 'basic', label: '기본 여행비' }, { id: 'extra', label: '추가 경험비' }]} value={kind} onChange={setKind} />
    {!!error && <Copy tone="small" style={{ color: palette.red }}>{error}</Copy>}
    {expense.amount > 0 && money.shortage > 0 && <Copy tone="small" style={{ color: palette.red }}>현재 사용 가능액보다 {formatWon(money.shortage)} 부족해요. 계획으로는 저장할 수 있습니다.</Copy>}
    {money.planShortage > 0 && <Copy tone="small" style={{ color: palette.red }}>등록 계획 합계의 부족 금액 {formatWon(money.planShortage)}</Copy>}
    {kind === 'extra' && <><Copy tone="small">매도 준비 {plan.prepare ?? '확인 필요'}{ '\n' }예상 결제 {plan.settlement ?? '확인 필요'}</Copy>{!!plan.warning && <Copy tone="small" style={{ color: palette.red }}>{plan.warning}</Copy>}</>}
  </Shell>;
}
