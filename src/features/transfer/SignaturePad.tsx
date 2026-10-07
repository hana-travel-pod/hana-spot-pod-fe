import { useEffect, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, View } from 'react-native';
import { Button, Copy, palette, ui } from '../../components/MobileUI';

interface Point { x: number; y: number }
type Stroke = Point[];
export default function SignaturePad({ onChange }: { onChange: (length: number) => void }) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const current = useRef<Stroke[]>([]);
  const bounds = useRef({ width: 0, height: 0 });
  useEffect(() => {
    const length = strokes.reduce((total, stroke) => total + stroke.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - stroke[index].x, point.y - stroke[index].y), 0), 0);
    onChange(length);
  }, [strokes, onChange]);
  const responder = useMemo(() => {
    const point = (event: GestureResponderEvent): Point => ({ x: Math.max(0, Math.min(bounds.current.width, event.nativeEvent.locationX)), y: Math.max(0, Math.min(bounds.current.height, event.nativeEvent.locationY)) });
    // PanResponder stores these callbacks; refs are read only when touch events fire.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: event => {
        if (current.current.flat().length >= 600) return;
        current.current = [...current.current, [point(event)]];
        setStrokes(current.current);
      },
      onPanResponderMove: event => {
        if (!current.current.length || current.current.flat().length >= 600) return;
        const next = point(event);
        const last = current.current[current.current.length - 1];
        const previous = last[last.length - 1];
        if (Math.hypot(next.x - previous.x, next.y - previous.y) < 3) return;
        current.current = [...current.current.slice(0, -1), [...last, next]];
        setStrokes(current.current);
      },
    });
  }, []);
  return <View style={{ gap: 12 }}>
    <View testID="signature-pad" accessibilityLabel="손가락으로 그리는 시연용 서명 영역" onLayout={event => { bounds.current = event.nativeEvent.layout; }} {...responder.panHandlers} style={{ height: 190, backgroundColor: palette.warm, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: palette.line }}>
      {!strokes.length && <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Copy style={ui.muted}>여기에 손가락으로 서명해 주세요</Copy></View>}
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>{strokes.map((stroke, si) => stroke.slice(1).map((next, index) => {
        const previous = stroke[index];
        const width = Math.hypot(next.x - previous.x, next.y - previous.y);
        return <View key={`${si}-${index}`} style={{ position: 'absolute', left: (previous.x + next.x) / 2 - width / 2, top: (previous.y + next.y) / 2 - 1.5, width, height: 3, borderRadius: 2, backgroundColor: palette.ink, transform: [{ rotate: `${Math.atan2(next.y - previous.y, next.x - previous.x)}rad` }] }} />;
      }))}</View>
    </View>
    <Button title="서명 지우기" dark onPress={() => { current.current = []; setStrokes([]); }} />
    <Copy tone="small" style={ui.muted}>발표용 동작 시연입니다. 실제 본인 인증이나 법적 전자서명이 아닙니다.</Copy>
  </View>;
}
