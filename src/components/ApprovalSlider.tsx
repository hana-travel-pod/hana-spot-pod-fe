import React, { useRef } from "react";
import { PanResponder, Platform, View } from "react-native";
import { colors, styles as s } from "../theme";
import { clampApproval } from "../domain";
import { AppText as Text } from "./Typography";

export function ApprovalSlider({
  value,
  maximum,
  onChange,
}: {
  value: number;
  maximum: number;
  onChange: (value: number) => void;
}) {
  const track = useRef<View>(null);
  const width = useRef(1);
  const left = useRef(0);
  const current = useRef({ maximum, onChange });
  current.current = { maximum, onChange };
  const update = (pageX: number) => {
    const ratio = Math.max(
      0,
      Math.min(
        1,
        (pageX - left.current - 12) / Math.max(1, width.current - 24),
      ),
    );
    current.current.onChange(
      clampApproval(
        1 + Math.round(ratio * (current.current.maximum - 1)),
        current.current.maximum,
      ),
    );
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: (event) => {
        const pageX = event.nativeEvent.pageX;
        track.current?.measureInWindow((x) => {
          left.current = x;
          update(pageX);
        });
      },
      onPanResponderMove: (event) => update(event.nativeEvent.pageX),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  const selected = clampApproval(value, maximum);
  const percent = maximum <= 1 ? 0 : ((selected - 1) / (maximum - 1)) * 100;
  return (
    <View style={s.field}>
      <View style={[s.between, { gap: 10 }]}>
        <Text style={s.label}>의사결정 승인 인원</Text>
        <Text style={{ color: colors.green, fontWeight: "700", fontSize: 22 }}>
          {selected}명
        </Text>
      </View>
      {Platform.OS === "web" ? (
        <input
          type="range"
          aria-label="의사결정 승인 인원"
          aria-valuetext={`${approvalLabel(maximum, selected)}`}
          min={1}
          max={maximum}
          step={1}
          value={selected}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{
            width: "100%",
            minHeight: 44,
            margin: 0,
            accentColor: colors.green,
            cursor: "pointer",
            touchAction: "pan-y",
          }}
        />
      ) : (
        <View
          ref={track}
          {...pan.panHandlers}
          onLayout={(event) => {
            width.current = event.nativeEvent.layout.width;
          }}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="의사결정 승인 인원"
          accessibilityValue={{
            min: 1,
            max: maximum,
            now: selected,
            text: approvalLabel(maximum, selected),
          }}
          accessibilityActions={[
            { name: "increment", label: "승인 인원 늘리기" },
            { name: "decrement", label: "승인 인원 줄이기" },
          ]}
          onAccessibilityAction={(event) =>
            onChange(
              clampApproval(
                selected +
                  (event.nativeEvent.actionName === "increment" ? 1 : -1),
                maximum,
              ),
            )
          }
          style={{
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <View
            style={{ height: 6, backgroundColor: colors.line, borderRadius: 3 }}
          >
            <View
              style={{
                width: `${percent}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.green,
              }}
            />
            <View
              style={{
                position: "absolute",
                left: `${percent}%`,
                marginLeft: -12,
                top: -9,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.green,
                borderWidth: 3,
                borderColor: colors.white,
              }}
            />
          </View>
        </View>
      )}
      <View style={s.between}>
        <Text style={s.muted}>1명</Text>
        <Text style={s.muted}>전체 {maximum}명</Text>
      </View>
      <Text style={[s.muted, { marginTop: 10 }]}>
        {approvalLabel(maximum, selected)} / 모집 완료 후 적용
      </Text>
    </View>
  );
}
const approvalLabel = (maximum: number, value: number) =>
  `전체 ${maximum}명 중 ${value}명 찬성`;
