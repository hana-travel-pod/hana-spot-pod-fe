import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Copy, palette } from '../components/MobileUI';
import { CalendarProvider } from '../features/calendar/CalendarProvider';
import NotificationBanner from '../features/calendar/NotificationBanner';
export default function Layout() {
  const [loaded, error] = useFonts({ 'Hana2-Regular': require('../../assets/fonts/Hana2-Regular.ttf'), 'Hana2-Medium': require('../../assets/fonts/Hana2-Medium.ttf'), 'Hana2-Bold': require('../../assets/fonts/Hana2-Bold.ttf') });
  if (error) return <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}><Copy>글꼴 로딩에 실패했어요. 앱을 다시 실행해주세요.</Copy></View>;
  if (!loaded) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={palette.green} /></View>;
  return <SafeAreaProvider><CalendarProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 180 }} /><NotificationBanner /></CalendarProvider></SafeAreaProvider>;
}
