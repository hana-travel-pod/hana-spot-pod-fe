import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Copy, ui } from './MobileUI';

export default function RecommendationLoading({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return <View style={ui.outer}><SafeAreaView style={ui.safe} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24 }}>
      <Image source={require('../../assets/byeoldori-loading.gif')} autoplay cachePolicy="none" contentFit="contain" accessibilityLabel="결과를 분석하는 별돌이 애니메이션" style={{ width: '100%', maxWidth: 280, aspectRatio: 1 }} />
      <Copy tone="title" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85} style={{ width: '100%', fontSize: 23, lineHeight: 32, textAlign: 'center', marginTop: 28 }}>하나픽 AI 별돌이가{'\n'}결과를 분석 중이에요</Copy>
      <Copy numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85} style={[ui.muted, { width: '100%', textAlign: 'center', marginTop: 12 }]}>선택한 경험과 예산에 맞는{'\n'}후보를 살펴보고 있어요</Copy>
    </ScrollView>
  </SafeAreaView></View>;
}
