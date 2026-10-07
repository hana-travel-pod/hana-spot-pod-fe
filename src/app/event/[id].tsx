import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Copy } from '../../components/MobileUI';
import { useCalendar } from '../../features/calendar/CalendarProvider';
import { ExpenseInfo, Shell } from '../../features/calendar/UI';
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { state, dispatch } = useCalendar(); const expense = state.expenses.find(item => item.id === id); const [deleting, setDeleting] = useState(false);
  if (!expense) return <Shell title="일정 상세"><Copy>일정을 찾을 수 없어요.</Copy><Button title="캘린더로" onPress={() => router.dismissTo('/')} /></Shell>;
  return <Shell title="일정 상세" footer={<Button title="캘린더 / 리스트로 돌아가기" onPress={() => router.dismissTo('/')} />}>
    <ExpenseInfo expense={expense} />
    {expense.kind === 'extra' && state.fund.status === 'withdrawable' && state.fund.amount > 0 && <Button title="트래블로그 환전·충전" onPress={() => router.push('/travelog')} />}
    <Button dark title="일정 수정" onPress={() => router.push({ pathname: '/event/edit', params: { id: expense.id } })} />
    {deleting ? <View style={{ gap: 12 }}><Copy>이 일정을 삭제할까요? 자금 상태는 변경되지 않아요.</Copy><Button title="삭제 확인" onPress={() => { dispatch({ type: 'delete', id: expense.id }); router.dismissTo('/'); }} /><Button dark title="삭제 취소" onPress={() => setDeleting(false)} /></View> : <Button dark title="일정 삭제" onPress={() => setDeleting(true)} />}
  </Shell>;
}
