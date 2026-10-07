import React, { useState } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { AppText as Text } from "./Typography";
import { Button, Sheet } from "./UI";
import { styles as s } from "../theme";

export function DemoResetIcon({
  children,
  style,
  onReset,
  testID,
}: {
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  onReset: () => Promise<boolean>;
  testID: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const show = () => {
    setError("");
    setOpen(true);
  };
  const reset = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (await onReset()) setOpen(false);
      else setError("초기화하지 못했어요. 다시 시도해주세요.");
    } catch {
      setError("초기화하지 못했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel="사용자 아이콘"
        accessibilityHint="누르면 시연 데이터 초기화 확인창이 열립니다."
        onPress={show}
        style={({ pressed }) => [style, pressed && { opacity: 0.7 }]}
      >
        {children}
      </Pressable>
      {open && (
        <Sheet
          title="시연 데이터 초기화"
          onClose={() => {
            if (!busy) setOpen(false);
          }}
          footer={
            <>
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
              <View style={[s.row, { gap: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="취소"
                    secondary
                    disabled={busy}
                    onPress={() => setOpen(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={busy ? "초기화 중…" : "초기화"}
                    disabled={busy}
                    onPress={() => void reset()}
                  />
                </View>
              </View>
            </>
          }
        >
          <View style={[s.page, { paddingTop: 24 }]}>
            <Text style={s.body}>
              생성한 팟, 가입 내역, 저장 목록, 프로필을 초기화하고 기본 시연
              데이터로 돌아갑니다.
            </Text>
          </View>
        </Sheet>
      )}
    </>
  );
}
