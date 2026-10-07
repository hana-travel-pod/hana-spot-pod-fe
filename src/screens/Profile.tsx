import { AppText as Text } from "../components/Typography";
import React, { useState } from "react";
import { ScrollView, View, Switch } from "react-native";
import { Age, Gender, Profile as ProfileType } from "../domain";
import { Button, Chips, Field, Icon, Sheet } from "../components/UI";
import { colors, styles as s } from "../theme";
export function Profile({
  initial,
  onClose,
  onSave,
}: {
  initial: ProfileType;
  onClose: () => void;
  onSave: (profile: ProfileType) => Promise<void>;
}) {
  const [p, setP] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!p.name.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setBusy(true);
    try {
      await onSave({ ...p, name: p.name.trim() });
    } catch {
      setError("저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title="내 여행 프로필"
      onClose={onClose}
      footer={
        <>
          {error && <Text style={s.error}>{error}</Text>}
          <Button
            title={busy ? "저장 중…" : "프로필 저장"}
            disabled={busy}
            onPress={save}
          />
        </>
      }
    >
      <ScrollView
        style={s.scroll}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.page, { paddingTop: 28 }]}
      >
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <View
            style={{
              backgroundColor: colors.mint,
              padding: 24,
              borderRadius: 45,
            }}
          >
            <Icon name="person-outline" size={36} color={colors.green} />
          </View>
          <Text style={[s.title, { marginTop: 14 }]}>
            떠날 준비를 해볼까요?
          </Text>
        </View>
        <Field
          label="닉네임"
          value={p.name}
          onChangeText={(v) => setP({ ...p, name: v })}
          maxLength={20}
        />
        <View style={s.field}>
          <Text style={s.label}>성별</Text>
          <Chips<Exclude<Gender, "제한 없음">>
            values={["여성", "남성"]}
            selected={p.gender}
            onChange={(v) => setP({ ...p, gender: v })}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>연령대</Text>
          <Chips<Exclude<Age, "제한 없음">>
            values={["20대", "30대", "40대", "50대 이상"]}
            selected={p.age}
            onChange={(v) => setP({ ...p, age: v })}
          />
        </View>
        <View style={s.between}>
          <View>
            <Text style={s.label}>데모 본인인증</Text>
            <Text style={s.muted}>
              {p.verified ? "인증 완료 상태" : "미인증 상태"}
            </Text>
          </View>
          <Switch
            accessibilityLabel="데모 본인인증"
            value={p.verified}
            onValueChange={(v) => setP({ ...p, verified: v })}
            trackColor={{ false: colors.line, true: colors.green }}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
