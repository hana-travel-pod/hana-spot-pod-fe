import { router } from 'expo-router';
import { Button, Copy } from '../components/MobileUI';
import { useCalendar } from '../features/calendar/CalendarProvider';
import { Shell } from '../features/calendar/UI';
export default function Reset() { const { dispatch } = useCalendar(); return <Shell title="데모 초기화"><Copy tone="title">데모를 초기화할까요?</Copy><Copy>등록과 수정 내용을 지우고 여행 준비 시점의 예시 일정과 투자 중 상태로 돌아갑니다.</Copy><Button title="초기화 확인" onPress={() => { dispatch({ type: 'reset' }); router.dismissTo('/'); }} /></Shell>; }
