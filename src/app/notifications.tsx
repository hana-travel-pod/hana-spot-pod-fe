import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Copy, ui } from '../components/MobileUI';
import { useCalendar } from '../features/calendar/CalendarProvider';
import { noticeText, salePlan } from '../features/calendar/model';
import { Shell, styles } from '../features/calendar/UI';
export default function Notifications() {
  const { state, dispatch } = useCalendar();
  return <Shell title="알림함">
    {!state.notices.length && <Copy style={ui.muted}>매도 준비일에 도달한 알림이 없어요.</Copy>}
    {state.notices.map(notice => {
      const expense = state.expenses.find(item => item.id === notice.expenseId); if (!expense) return null;
      return <Pressable key={notice.id} accessibilityRole="button" accessibilityLabel={`${expense.name} 알림 상세`} style={styles.card} onPress={() => { dispatch({ type: 'notice-read', id: notice.id }); dispatch({ type: 'select', id: expense.id }); router.push({ pathname: '/event/[id]', params: { id: expense.id } }); }}><Copy tone="label">매도 준비 안내{notice.read ? '' : ' (새 알림)'}</Copy><Copy>{noticeText(expense)}</Copy><Copy tone="small" style={ui.muted}>매도 준비일 {salePlan(expense, state.fund, state.today).prepare}</Copy></Pressable>;
    })}
    <Copy tone="small" style={ui.muted}>앱 내 안내입니다. 알림을 확인해도 실제 매도 주문은 실행되지 않아요.</Copy>
  </Shell>;
}
