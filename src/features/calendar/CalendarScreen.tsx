import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button, Copy, palette, ui } from '../../components/MobileUI';
import { formatWon } from '../../utils/budget';
import { useCalendar } from './CalendarProvider';
import { monthCells, moveMonth, RULE_NOTE, salePlan } from './model';
import { colors, ExpenseCard, FundSummary, Shell } from './UI';

export default function CalendarScreen() {
  const { state, dispatch } = useCalendar();
  const sorted = [...state.expenses].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const marks = (date: string) => sorted.flatMap(expense => {
    const plan = salePlan(expense, state.fund, state.today); const labels: string[] = [];
    if (expense.date === date) labels.push('지출 예정');
    if (plan.prepare === date) labels.push('매도 준비');
    if (plan.settlement === date) labels.push('예상 결제');
    return labels.length ? [{ expense, labels }] : [];
  });
  const viewToggle = <View style={{ flexDirection: 'row' }}><Pressable accessibilityRole="button" accessibilityLabel="알림함" onPress={() => router.push('/notifications')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={state.notices.some(item => !item.read) ? 'notifications' : 'notifications-outline'} size={20} color={palette.green} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={state.view === 'calendar' ? '리스트로 보기' : '캘린더로 보기'} onPress={() => dispatch({ type: 'view', view: state.view === 'calendar' ? 'list' : 'calendar' })} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={state.view === 'calendar' ? 'list-outline' : 'calendar-outline'} size={22} color={palette.green} />
  </Pressable></View>;
  return <Shell title="여행 자금 캘린더" back={false} compact headerAction={viewToggle} footer={<Button title="일정 추가" onPress={() => router.push('/event/edit')} />}>
    {state.view === 'list' ? <View style={{ gap: 12 }}><Copy tone="label">다가오는 지출 일정</Copy>{sorted.map(expense => <ExpenseCard key={expense.id} expense={expense} />)}{!sorted.length && <Copy style={ui.muted}>등록한 일정이 없어요.</Copy>}</View> : <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => dispatch({ type: 'month', month: moveMonth(state.month, -1) })} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={20} color={palette.ink} /></Pressable>
        <Copy tone="label">{Number(state.month.slice(0, 4))}년 {Number(state.month.slice(5))}월</Copy>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => dispatch({ type: 'month', month: moveMonth(state.month, 1) })} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-forward" size={20} color={palette.ink} /></Pressable>
      </View>
      <View testID="calendar-grid" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['일', '월', '화', '수', '목', '금', '토'].map(day => <View key={day} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 8 }}><Copy tone="small" style={ui.muted}>{day}</Copy></View>)}
        {monthCells(state.month).map(date => {
          const types = Array.from(new Set(marks(date).flatMap(item => item.labels)));
          return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${date} ${types.join(', ')}`} accessibilityState={{ selected: date === state.selectedDate }} onPress={() => dispatch({ type: 'date', date })} style={{ width: `${100 / 7}%`, minHeight: 52, alignItems: 'center', paddingTop: 6, borderRadius: 12, backgroundColor: date === state.selectedDate ? palette.mint : '#fff', opacity: date.startsWith(state.month) ? 1 : 0.35 }}>
            <Copy tone="label" style={{ fontSize: 14 }}>{Number(date.slice(8))}</Copy>
            <View style={{ flexDirection: 'row', gap: 2, marginTop: 3 }}>{types.map(type => <View key={type} style={{ width: 12, height: 12, borderRadius: type === '예상 결제' ? 2 : 6, alignItems: 'center', justifyContent: 'center', backgroundColor: type === '지출 예정' ? colors.spend : type === '매도 준비' ? colors.prepare : colors.settle }}><Copy style={{ fontSize: 8, lineHeight: 12, color: '#fff' }}>{type === '지출 예정' ? '지' : type === '매도 준비' ? '매' : '결'}</Copy></View>)}</View>
          </Pressable>;
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Copy tone="small" style={{ color: colors.spend }}>지 지출 예정</Copy><Copy tone="small" style={{ color: colors.prepare }}>매 매도 준비</Copy><Copy tone="small" style={{ color: colors.settle }}>결 예상 결제</Copy></View>
      <View style={{ gap: 12, marginTop: 8 }}><Copy tone="label">{state.selectedDate} 일정</Copy><Copy tone="small" style={ui.muted}>이날 지출 예정 {formatWon(sorted.filter(item => item.date === state.selectedDate).reduce((sum, item) => sum + item.amount, 0))}</Copy>{marks(state.selectedDate).map(item => <ExpenseCard key={item.expense.id} expense={item.expense} caption={item.labels.join(', ')} />)}{!marks(state.selectedDate).length && <Copy style={ui.muted}>이날 등록한 일정이 없어요.</Copy>}</View>
    </>}
    <FundSummary />
    <Copy tone="small" style={ui.muted}>{RULE_NOTE}</Copy>
  </Shell>;
}
