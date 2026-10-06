import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SelectionProvider } from '../state/Selection';

export default function RootLayout() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  const [loaded, error] = useFonts({
    'Hana2-Regular': require('../../assets/fonts/Hana2-Regular.ttf'),
    'Hana2-Medium': require('../../assets/fonts/Hana2-Medium.ttf'),
    'Hana2-Bold': require('../../assets/fonts/Hana2-Bold.ttf'),
  });
  if (error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Hana2 글꼴을 불러오지 못했습니다. 앱을 다시 실행해 주세요.</Text><Text>{error.message}</Text></View>;
  if (!loaded) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}><ActivityIndicator color="#008B78" accessibilityLabel="Hana2 글꼴 로딩 중" /></View>;
  return <SafeAreaProvider><SelectionProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade', animationDuration: 180 }}><Stack.Screen name="index" /><Stack.Screen name="category" options={{ animation: reduceMotion ? 'none' : 'slide_from_right', animationDuration: 300 }} /><Stack.Screen name="budget" options={{ animation: reduceMotion ? 'none' : 'slide_from_right', animationDuration: 300 }} /><Stack.Screen name="result" /></Stack></SelectionProvider></SafeAreaProvider>;
}
