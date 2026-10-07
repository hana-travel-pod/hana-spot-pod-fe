import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Copy, Money, palette, Row, ui } from '../../components/MobileUI';
import { useCalendar } from './CalendarProvider';
import { businessShift, Expense, formatEuro, FUND_DESCRIPTION, FUND_LABEL, fundBuckets, funding, RULE_NOTE, salePlan } from './model';
import { formatWon } from '../../utils/budget';

export const colors = { spend: palette.green, prepare: '#B07521', settle: '#557DC0' };
export const kindLabel = (kind: Expense['kind']) => kind === 'basic' ? '기본 여행비' : '추가 경험비';
export function Shell({ title, children, footer, back = true, headerAction, compact = false }: PropsWithChildren<{ title: string; footer?: React.ReactNode; back?: boolean; headerAction?: React.ReactNode; compact?: boolean }>) {
  return <View style={ui.outer}><SafeAreaView style={ui.safe} edges={['top', 'bottom']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={ui.header}>{back && <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={() => router.back()} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}><Copy>‹ 뒤로</Copy></Pressable>}{back ? <Copy tone="small" style={ui.muted}>{title}</Copy> : <Pressable onLongPress={() => router.push('/demo')} delayLongPress={900} style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}><Copy tone="label">{title}</Copy></Pressable>}{headerAction}</View>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'} contentContainerStyle={{ padding: 20, paddingTop: compact ? 0 : 20, gap: compact ? 12 : 20, paddingBottom: 32 }}>{children}</ScrollView>
    {!!footer && <View style={ui.footer}>{footer}</View>}
  </KeyboardAvoidingView></SafeAreaView></View>;
}
export function Segment<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <View style={styles.segment}>{options.map(option => <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: value === option.id }} aria-checked={value === option.id} onPress={() => onChange(option.id)} style={[styles.segmentItem, value === option.id && styles.active]}><Copy tone="label" style={{ fontSize: 14, color: value === option.id ? palette.green : palette.muted, textAlign: 'center' }}>{option.label}</Copy></Pressable>)}</View>;
}
export function EuroAmount({ cents, label, hint }: { cents: number; label: string; hint?: string }) {
  return <View style={{ backgroundColor: palette.mint, borderRadius: 18, padding: 20, gap: 8 }}>
    <Copy tone="small" style={ui.muted}>{label}</Copy>
    <Copy testID="euro-amount" tone="title" numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 40, lineHeight: 48, color: palette.green }}>{formatEuro(cents)}</Copy>
    {hint && <Copy tone="small" style={ui.muted}>{hint}</Copy>}
  </View>;
}
export function ExpenseCard({ expense, caption }: { expense: Expense; caption?: string }) {
  const { state, dispatch } = useCalendar();
  const plan = salePlan(expense, state.fund, state.today);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${expense.name} 상세`} onPress={() => { dispatch({ type: 'select', id: expense.id }); router.push({ pathname: '/event/[id]', params: { id: expense.id } }); }} style={[styles.card, state.selectedId === expense.id && { borderColor: palette.green, borderWidth: 1 }]}>
    {caption && <Copy tone="small" style={{ color: palette.green }}>{caption}</Copy>}
    <Copy tone="label">{expense.name}</Copy><Copy tone="small" style={ui.muted}>{expense.date} 지출 예정</Copy><Copy tone="title" style={{ fontSize: 22, lineHeight: 30 }}>{formatWon(expense.amount)}</Copy>
    <Copy tone="small">{kindLabel(expense.kind)}{ '\n' }{expense.kind === 'basic' ? '여행비 사용 가능' : FUND_LABEL[state.fund.status]}</Copy>
    {expense.kind === 'extra' && <Copy tone="small" style={ui.muted}>매도 준비 {plan.prepare ?? '확인 필요'}</Copy>}
    {!!plan.warning && <Copy tone="small" style={{ color: palette.red }}>{plan.warning}</Copy>}
  </Pressable>;
}
export function ExpenseInfo({ expense }: { expense: Expense }) {
  const { state } = useCalendar(); const plan = salePlan(expense, state.fund, state.today); const money = funding(state, expense);
  return <View style={{ gap: 10 }}>
    <Copy tone="small" style={ui.muted}>{kindLabel(expense.kind)}</Copy><Copy tone="title">{expense.name}</Copy><Money amount={expense.amount} /><Row label="지출 예정일" value={expense.date} />
    <Row label="현재 사용 가능액" value={formatWon(money.available)} />
    {money.shortage > 0 && <Copy style={{ color: palette.red }}>현재 사용 가능액보다 {formatWon(money.shortage)} 부족해요.</Copy>}
    {money.planShortage > 0 && <Copy tone="small" style={{ color: palette.red }}>같은 자금의 등록 계획 합계가 예시 자금보다 {formatWon(money.planShortage)} 많아요.</Copy>}
    {expense.kind === 'basic' ? <Copy tone="small" style={ui.muted}>기본 여행비 일정에는 투자 매도 알림을 붙이지 않아요.</Copy> : <>
      <View style={ui.divider} /><Row label="연결 투자상품" value={state.fund.product === 'domestic_etf' ? '국내 상장 ETF (시연)' : '기타 투자상품 (시연)'} />
      <Row label="자금 상태" value={FUND_LABEL[state.fund.status]} /><Copy tone="small" style={ui.muted}>{FUND_DESCRIPTION[state.fund.status]}</Copy>
      <Row label="매도 준비일" value={plan.prepare ?? '확인 필요'} />
      <Row label="체결 가정 예상 결제일" value={plan.settlement ?? '확인 필요'} />
      <Row label="예상 출금 가능일 (가정)" value={plan.settlement ?? '확인 필요'} />
      <Copy tone="small" style={ui.muted}>국내 ETF는 체결 후 T+2영업일 결제를 적용해요. 예상 출금 가능일은 결제 당일 출금할 수 있는 예시 계좌를 가정합니다.</Copy>
      <Copy tone="small" style={ui.muted}>준비일에 매도가 체결된다고 가정한 날짜입니다. 주문 제출만으로 체결되지 않아요.</Copy>
      {state.fund.filledDate && <><Row label="시연 매도 체결일" value={state.fund.filledDate} /><Row label="시연 체결 기준 결제 예상" value={businessShift(state.fund.filledDate, 2) ?? '확인 필요'} /></>}
      <Row label="실제 출금 가능 상태" value={state.fund.status === 'withdrawable' ? '사용 가능 (예시)' : '아직 사용 불가 (예시)'} />
      {!!plan.warning && <Copy style={{ color: palette.red }}>{plan.warning}</Copy>}
      <Copy tone="small" style={ui.muted}>{RULE_NOTE}</Copy>
    </>}
  </View>;
}
export function FundSummary() {
  const { state, migrationMessage } = useCalendar(); const buckets = fundBuckets(state);
  return <View style={[styles.card, { padding: 16, gap: 4 }]} testID="fund-summary">
    <Copy tone="label" style={{ fontSize: 16 }}>예시 자금 현황</Copy>
    {(Object.keys(FUND_LABEL) as (keyof typeof FUND_LABEL)[]).map(status => <Row key={status} label={FUND_LABEL[status]} value={formatWon(buckets[status])} valueColor={state.fund.status === status ? palette.green : palette.muted} />)}
    {state.walletEuroCents > 0 && <Row label="시연 유로 지갑" value={formatEuro(state.walletEuroCents)} />}
    {!!migrationMessage && <Copy tone="small" style={ui.muted}>{migrationMessage}</Copy>}
    {state.fund.status === 'withdrawable' && state.fund.amount > 0 && <Button title="트래블로그 환전·충전" onPress={() => router.push('/travelog')} />}
  </View>;
}
export const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: palette.warm, gap: 4 },
  segmentItem: { flex: 1, minHeight: 44, paddingVertical: 10, paddingHorizontal: 6, justifyContent: 'center', borderRadius: 10 }, active: { backgroundColor: palette.mint },
  card: { borderRadius: 18, backgroundColor: palette.mint, padding: 18, gap: 8 },
  input: { minHeight: 52, padding: 14, borderWidth: 1, borderColor: palette.line, borderRadius: 12, fontFamily: 'Hana2-Regular', color: palette.ink, fontSize: 16, backgroundColor: '#fff' },
});
