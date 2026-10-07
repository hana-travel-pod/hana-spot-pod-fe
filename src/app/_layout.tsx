import { ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TransferProvider } from '../features/transfer/TransferProvider';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Hana2-Regular': require('../../assets/fonts/Hana2-Regular.ttf'),
    'Hana2-Medium': require('../../assets/fonts/Hana2-Medium.ttf'),
    'Hana2-Bold': require('../../assets/fonts/Hana2-Bold.ttf'),
  });
  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}><Text>글꼴을 불러오지 못했습니다. 앱을 다시 실행해 주세요.</Text><Text>{error.message}</Text></View>;
  if (!loaded) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#009B87" /></View>;
  return <SafeAreaProvider><TransferProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="index" /></Stack></TransferProvider></SafeAreaProvider>;
}
