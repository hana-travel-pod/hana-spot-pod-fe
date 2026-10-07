import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Copy, palette } from '../../components/MobileUI';

export default function ApprovalNotification({ message, onClose, onApprove, onReject }: {
  message: string; onClose: () => void; onApprove: () => void; onReject: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  const close = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => { if (finished) onClose(); });
  }, [onClose, progress]);
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => { animation.stop(); progress.stopAnimation(); };
  }, [progress]);
  useEffect(() => {
    // Keep the choices visible while the presenter interacts with the expanded banner.
    if (expanded) return;
    const timer = setTimeout(close, 5500);
    return () => clearTimeout(timer);
  }, [close, expanded]);
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderRelease: (_, gesture) => { if (gesture.dy < -24 || gesture.vy < -0.5) close(); },
  }), [close]);
  return <View pointerEvents="box-none" style={[styles.position, { top: insets.top + 6 }]}>
    <Animated.View {...swipe.panHandlers} testID="approval-notification" style={[styles.banner, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-150, 0] }) }] }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="이체 승인 알림 펼치기" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={styles.content}>
        <View style={styles.appRow}>
          <View style={styles.icon}><Copy tone="small" style={{ color: '#fff', fontSize: 10 }}>하나</Copy></View>
          <Copy tone="small" style={{ color: palette.muted, flex: 1 }}>하나 스팟 팟</Copy>
          <Copy tone="small" style={{ color: palette.muted }}>지금</Copy>
        </View>
        <Copy tone="label" numberOfLines={expanded ? undefined : 2} style={styles.message}>{message}</Copy>
      </Pressable>
      {expanded && <>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="거절" onPress={onReject} style={styles.action}><Copy tone="label" style={{ color: palette.red }}>거절</Copy></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="승인 진행" onPress={onApprove} style={[styles.action, styles.primary]}><Copy tone="label" style={{ color: palette.green }}>승인 진행</Copy></Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="알림 닫기" onPress={close} style={styles.close}><Copy tone="small" style={{ color: palette.muted }}>닫기</Copy></Pressable>
      </>}
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 14, zIndex: 20 },
  // Translucent white works in Expo Go without relying on native blur support.
  banner: { borderRadius: 20, backgroundColor: 'rgba(250, 252, 251, 0.94)', shadowColor: '#202C30', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 10, elevation: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(220, 226, 223, 0.65)' },
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 7 },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.green },
  message: { fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  action: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  primary: { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  close: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
});
