import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Copy, palette } from '../../components/MobileUI';
import { useCalendar } from './CalendarProvider';
import { noticeText } from './model';
export default function NotificationBanner() {
  const { state, dispatch } = useCalendar(); const insets = useSafeAreaInsets();
  const [id, setId] = useState<string | null>(null); const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (id) return;
    const next = state.notices.find(item => !item.shown);
    if (!next) return;
    const timer = setTimeout(() => { setId(next.id); dispatch({ type: 'notice-shown', id: next.id }); }, 100);
    return () => clearTimeout(timer);
  }, [id, state.notices, dispatch]);
  useEffect(() => {
    if (!id) return;
    progress.setValue(0); Animated.timing(progress, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    const timer = setTimeout(() => Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setId(null)), 5500);
    return () => { clearTimeout(timer); progress.stopAnimation(); };
  }, [id, progress]);
  const notice = state.notices.find(item => item.id === id); const expense = state.expenses.find(item => item.id === notice?.expenseId);
  if (!notice || !expense) return null;
  return <Animated.View style={{ position: 'absolute', top: insets.top + 8, alignSelf: 'center', width: '94%', maxWidth: 402, zIndex: 100, opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-100, 0] }) }], backgroundColor: 'rgba(250,253,252,0.97)', borderRadius: 18, padding: 14, boxShadow: '0px 3px 12px rgba(20,45,38,0.12)' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="notifications-outline" size={18} color={palette.green} /><Copy tone="label" style={{ fontSize: 13, flex: 1 }}>하나 스팟 팟</Copy><Copy tone="small">지금</Copy><Pressable accessibilityRole="button" accessibilityLabel="알림 배너 닫기" onPress={() => setId(null)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={16} color={palette.muted} /></Pressable></View>
    <Pressable accessibilityRole="button" accessibilityLabel={`${expense.name} 매도 준비 알림 열기`} onPress={() => { dispatch({ type: 'notice-read', id: notice.id }); dispatch({ type: 'select', id: expense.id }); setId(null); router.push({ pathname: '/event/[id]', params: { id: expense.id } }); }}><Copy tone="small" numberOfLines={2}>{noticeText(expense)}</Copy></Pressable>
  </Animated.View>;
}
