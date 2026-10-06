import React, { useState } from "react";
import { ScrollView, Text, View, Switch } from "react-native";
import {
  Badge,
  Button,
  Chips,
  DetailRow,
  Field,
  Icon,
  Sheet,
} from "../components/UI";
import {
  Age,
  Gender,
  Investment,
  Pod,
  money,
  today,
  validatePod,
  emptyPodDraft,
  buildPod,
  destinationLabel,
  travelDateLabel,
  budgetLabel,
} from "../domain";
import { DateField } from "../components/DateField";
import { categories, destinationImages } from "../data";
import { colors, styles as s } from "../theme";

export function CreatePod({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (pod: Pod) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ ...emptyPodDraft });
  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };
  const pod = buildPod(
    form,
    `pod-${Date.now()}`,
    form.category === "동남아"
      ? destinationImages.bali
      : form.category === "유럽"
        ? destinationImages.europe
        : form.category === "국내"
          ? destinationImages.korea
          : destinationImages.japan,
  );
  const next = async () => {
    const issue = validatePod(
      step === 0 ? { ...pod, deposit: 0, approval: 1 } : pod,
    );
    if (issue) {
      setError(issue);
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      setError("");
    } else {
      setBusy(true);
      try {
        await onCreate({
          ...pod,
          title: pod.title.trim(),
          country: pod.country.trim(),
          destination: pod.destination.trim(),
          description: pod.description.trim(),
        });
      } catch {
        setError("저장하지 못했어요. 다시 시도해주세요.");
      } finally {
        setBusy(false);
      }
    }
  };
  return (
    <Sheet
      title="새로운 여행 팟"
      onClose={onClose}
      footer={
        <>
          {error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <View style={[s.row, { gap: 10 }]}>
            {step > 0 && (
              <View style={{ flex: 1 }}>
                <Button
                  title="이전"
                  secondary
                  disabled={busy}
                  onPress={() => {
                    setStep(step - 1);
                    setError("");
                  }}
                />
              </View>
            )}
            <View style={{ flex: 2 }}>
              <Button
                title={busy ? "저장 중…" : step === 2 ? "팟 만들기" : "다음"}
                disabled={busy}
                onPress={next}
              />
            </View>
          </View>
        </>
      }
    >
      <ScrollView
        key={step}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.page}
      >
        <View style={[s.row, { gap: 6, marginTop: 24 }]}>
          {["여행 계획", "참여 조건", "최종 확인"].map((v, i) => (
            <View key={v} style={{ flex: 1 }}>
              <View
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i <= step ? colors.green : colors.line,
                  marginBottom: 9,
                }}
              />
              <Text
                style={{
                  color: i === step ? colors.green : colors.muted,
                  fontSize: 11,
                }}
              >
                {i + 1}. {v}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[s.heading, { marginTop: 28, marginBottom: 9 }]}>
          {
            [
              "어떤 여행을 떠날까요?",
              "함께할 기준을 맞춰요",
              "우리의 여행, 준비 완료!",
            ][step]
          }
        </Text>
        <Text style={[s.muted, { marginBottom: 26 }]}>
          {
            [
              "모든 항목은 선택 사항이에요. 비워 두고 시작해도 좋아요.",
              "필요한 조건만 정해요. 기본적으로 누구나 참가할 수 있어요.",
              "모집을 시작하기 전에 내용을 확인해주세요.",
            ][step]
          }
        </Text>
        {step === 0 && (
          <>
            <Field
              label="팟 이름 (선택)"
              placeholder="예: 느긋하게, 교토 한 바퀴"
              maxLength={40}
              value={form.title}
              onChangeText={(v) => set("title", v)}
            />
            <View style={s.field}>
              <Text style={s.label}>여행 지역</Text>
              <Chips
                values={["미정", ...categories.slice(1)]}
                selected={form.category}
                onChange={(v) => set("category", v)}
              />
            </View>
            <Field
              label="국가 (선택)"
              placeholder="예: 일본"
              value={form.country}
              onChangeText={(v) => set("country", v)}
              maxLength={40}
            />
            <Field
              label="도시 또는 공항 (선택)"
              placeholder="예: 교토 또는 간사이 공항 (KIX)"
              value={form.destination}
              onChangeText={(v) => set("destination", v)}
              maxLength={60}
            />
            <DateField
              label="여행 시작일 (선택)"
              value={form.startDate}
              minimumDate={today()}
              onChange={(v) => {
                setForm((f) => ({
                  ...f,
                  startDate: v,
                  endDate: v && f.endDate && f.endDate < v ? "" : f.endDate,
                }));
                setError("");
              }}
            />
            <DateField
              label="여행 종료일 (선택)"
              value={form.endDate}
              minimumDate={form.startDate || today()}
              onChange={(v) => set("endDate", v)}
            />
            <Field
              label="모집 인원 (선택)"
              hint="미입력 시 4명 · 개설자를 포함한 전체 인원 · 2~20명"
              placeholder="기본 4명"
              keyboardType="number-pad"
              value={form.capacity}
              onChangeText={(v) => set("capacity", v)}
              maxLength={2}
            />
            <Field
              label="1인 예상 기본 경비 (원) (선택)"
              placeholder="예: 850000"
              hint="미입력 시 미정 · 항공·숙박·기본 식비 포함, 투자금·예치금 제외"
              keyboardType="number-pad"
              value={form.budget}
              onChangeText={(v) => set("budget", v)}
              maxLength={9}
            />
          </>
        )}
        {step === 1 && (
          <>
            <View style={s.field}>
              <Text style={s.label}>성별</Text>
              <Chips<Gender>
                values={["제한 없음", "여성", "남성"]}
                selected={form.gender}
                onChange={(v) => set("gender", v)}
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>연령대</Text>
              <Chips<Age>
                values={["제한 없음", "20대", "30대", "40대", "50대 이상"]}
                selected={form.age}
                onChange={(v) => set("age", v)}
              />
            </View>
            <View style={[s.between, s.field]}>
              <View>
                <Text style={s.label}>본인인증 필수</Text>
                <Text style={s.muted}>인증을 마친 사람과 함께해요</Text>
              </View>
              <Switch
                accessibilityLabel="본인인증 필수"
                value={form.verified}
                onValueChange={(v) => set("verified", v)}
                trackColor={{ false: "#DDE4E2", true: colors.green }}
              />
            </View>
            <View style={[s.between, s.field]}>
              <View>
                <Text style={s.label}>투자도 함께 계획하기</Text>
                <Text style={s.muted}>희망 투자 방향을 미리 맞춰요</Text>
              </View>
              <Switch
                accessibilityLabel="투자 포함"
                value={form.investment !== "없음"}
                onValueChange={(v) => set("investment", v ? "안정" : "없음")}
                trackColor={{ false: "#DDE4E2", true: colors.green }}
              />
            </View>
            {form.investment !== "없음" && (
              <View style={s.field}>
                <Text style={s.label}>희망 투자 스타일</Text>
                <Chips<Investment>
                  values={["안정", "균형", "공격"]}
                  selected={form.investment}
                  onChange={(v) => set("investment", v)}
                />
                <Text style={[s.muted, { marginTop: 10 }]}>
                  모집 단계의 희망 방향이에요. 실제 상품과 금액은 팟 구성 후
                  별도로 합의해요.
                </Text>
              </View>
            )}
            <View style={s.divider} />
            <Text style={[s.title, { marginBottom: 22 }]}>우리 팟의 약속</Text>
            <Field
              label="의사결정 승인 인원 (선택)"
              value={form.approval}
              onChangeText={(v) => set("approval", v)}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="미입력 시 과반수"
              hint={`전체 ${pod.capacity}명 중 찬성 인원 · 미입력 시 과반수 · 모집 완료 후 적용`}
            />
            <Field
              label="노쇼 방지 예치금 (원) (선택)"
              value={form.deposit}
              onChangeText={(v) => set("deposit", v)}
              keyboardType="number-pad"
              maxLength={9}
              placeholder="미입력 시 0원"
              hint="미입력 시 예치금 없음 · 납부·반환·취소 기준은 팟 구성 후 별도 합의해요."
            />
            <Field
              label="모임 상세 내용 (선택)"
              placeholder="원한다면 여행 콘셉트와 활동을 알려주세요."
              value={form.description}
              onChangeText={(v) => set("description", v)}
              multiline
              maxLength={2000}
            />
          </>
        )}
        {step === 2 && (
          <>
            <View style={s.notice}>
              <View style={[s.row, { gap: 8 }]}>
                <Icon name="sparkles" color={colors.green} />
                <Text style={s.title}>{pod.title}</Text>
              </View>
              <Text style={[s.body, { marginTop: 9 }]}>
                {destinationLabel(pod)}
              </Text>
            </View>
            <DetailRow label="여행 일정" value={travelDateLabel(pod)} />
            <DetailRow
              label="전체 인원"
              value={`${pod.capacity}명 (개설자 포함)`}
            />
            <DetailRow label="1인 기본 경비" value={budgetLabel(pod.budget)} />
            <DetailRow
              label="성별 · 연령"
              value={`${form.gender} · ${form.age}`}
            />
            <DetailRow
              label="본인인증"
              value={form.verified ? "필수" : "선택"}
            />
            <DetailRow
              label="투자"
              value={
                form.investment === "없음"
                  ? "포함하지 않음"
                  : `${form.investment} 스타일 희망`
              }
            />
            <DetailRow
              label="의사결정 승인"
              value={`${pod.capacity}명 중 ${pod.approval}명 찬성`}
            />
            <DetailRow
              label="노쇼 방지 예치금"
              value={`${money(pod.deposit)}원`}
            />
            <View style={s.divider} />
            <Text style={s.label}>모임 상세</Text>
            <Text style={s.body}>
              {pod.description || "자세한 여행 계획은 함께 정해요."}
            </Text>
            <View style={s.notice}>
              <Badge>모집을 시작해요</Badge>
              <Text style={[s.muted, { marginTop: 8 }]}>
                팟을 만들면 탐색 목록에 표시돼요. 참가 조건을 충족하면 자동으로
                가입돼요. 실제 결제와 투자는 진행하지 않아요.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}
