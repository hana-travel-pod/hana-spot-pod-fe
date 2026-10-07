import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from './MobileUI';

export default function RecommendationCard({ children }: PropsWithChildren) {
  return <View testID="recommendation-card" style={styles.card}>{children}</View>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 22, backgroundColor: palette.mint, padding: 20, gap: 10 },
});
