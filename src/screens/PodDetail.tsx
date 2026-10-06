import React, { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import {
  Application,
  Pod,
  Profile,
  eligibility,
  money,
  today,
  destinationLabel,
  travelDateLabel,
} from "../domain";
import { Badge, Button, DetailRow, Field, Icon, Sheet } from "../components/UI";
import { colors, styles as s } from "../theme";
export function PodDetail({
  pod,
  profile,
  application,
  onClose,
  onViewMine,
  onApply,
}: {
  pod: Pod;
  profile: Profile;
  application?: Application;
  onClose: () => void;
  onViewMine: () => void;
  onApply: (message: string) => Promise<void>;
}) {
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const blocked = eligibility(pod, profile);
  const submit = async () => {
    setError("");
    if (blocked) {
      setError(blocked);
      return;
    }
    setBusy(true);
    try {
      await onApply(message.trim());
      setApplying(false);
    } catch {
      setError("참가를 확정하지 못했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title={applying ? "참가 신청" : "여행 팟 상세"}
      onClose={
        applying
          ? () => {
              setApplying(false);
              setError("");
            }
          : onClose
      }
      footer={
        <>
          {error && <Text style={s.error}>{error}</Text>}
          {application ? (
            <Button
              title={
                application.status === "approved"
                  ? "가입 완료 · 내 팟에서 확인"
                  : "이전 신청 · 참가 조건 확인"
              }
              secondary
              onPress={onViewMine}
            />
          ) : pod.host === "나" ? (
            <Button title="내가 만든 팟이에요" secondary onPress={onClose} />
          ) : (
            <>
              <Text style={[s.muted, { textAlign: "center", marginBottom: 9 }]}>
                {blocked || "참가하면 자동으로 가입이 확정돼요"}
              </Text>
              <Button
                title={
                  busy
                    ? "신청 중…"
                    : applying
                      ? "참가 확정하기"
                      : "이 팟에 함께하기"
                }
                disabled={!!blocked || busy}
                onPress={applying ? submit : () => setApplying(true)}
              />
            </>
          )}
        </>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {!applying && (
          <Image
            source={{ uri: pod.image }}
            style={{ width: "100%", height: 245, backgroundColor: "#C9E3D9" }}
          />
        )}
        <View style={[s.page, { paddingTop: 24 }]}>
          <View style={[s.row, { gap: 7 }]}>
            <Badge>
              {(pod.startDate || pod.endDate) &&
              (pod.startDate || pod.endDate) < today()
                ? "모집 종료"
                : pod.members >= pod.capacity
                  ? "모집 완료"
                  : "모집 중"}
            </Badge>
            <Text style={{ fontSize: 12, color: colors.green }}>
              {destinationLabel(pod)}
            </Text>
          </View>
          <Text style={[s.heading, { marginTop: 13, marginBottom: 13 }]}>
            {pod.title}
          </Text>
          {!applying && (
            <View style={[s.row, { gap: 9, marginBottom: 18 }]}>
              <View
                style={{
                  borderRadius: 18,
                  padding: 8,
                  backgroundColor: colors.mint,
                }}
              >
                <Icon name="person" size={18} color={colors.green} />
              </View>
              <Text style={s.muted}>
                팟장{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {pod.host}
                </Text>
              </Text>
            </View>
          )}
          <DetailRow label="여행 일정" value={travelDateLabel(pod)} />
          <DetailRow
            label="모집 인원"
            value={`${pod.members} / ${pod.capacity}명 (개설자 포함)`}
          />
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: 16,
              padding: 18,
              marginVertical: 14,
            }}
          >
            <View style={s.between}>
              <Text style={s.muted}>1인 예상 기본 경비</Text>
              <Text
                style={{ color: colors.text, fontSize: 23, fontWeight: "800" }}
              >
                {pod.budget > 0 ? money(pod.budget) : "미정"}
                {pod.budget > 0 && <Text style={{ fontSize: 14 }}> 원</Text>}
              </Text>
            </View>
            <Text style={[s.muted, { marginTop: 8 }]}>
              항공·숙박·기본 식비 포함 · 투자금과 예치금 제외
            </Text>
          </View>
          <Text style={[s.title, s.section]}>함께할 조건</Text>
          <DetailRow label="성별" value={pod.gender} />
          <DetailRow label="연령대" value={pod.age} />
          <DetailRow label="본인인증" value={pod.verified ? "필수" : "선택"} />
          <DetailRow
            label="투자 계획"
            value={
              pod.investment === "없음"
                ? "여행만 함께해요"
                : `${pod.investment} 스타일 희망`
            }
          />
          {pod.investment !== "없음" && (
            <View style={s.notice}>
              <Text
                style={[
                  s.body,
                  { color: colors.green, fontWeight: "600", fontSize: 13 },
                ]}
              >
                투자 방향만 미리 맞춰요
              </Text>
              <Text style={[s.muted, { marginTop: 5 }]}>
                희망 투자 스타일이며 실제 상품·금액은 모임 구성 후 별도로
                합의해요. 기본 경비에 투자금은 포함되지 않아요.
              </Text>
            </View>
          )}
          <Text style={[s.title, s.section]}>우리 팟의 약속</Text>
          <DetailRow
            label="의견 승인 기준"
            value={`${pod.capacity}명 중 ${pod.approval}명 찬성`}
          />
          <DetailRow
            label="노쇼 방지 예치금"
            value={`${money(pod.deposit)}원`}
          />
          <Text style={s.muted}>
            승인 기준은 모집 완료 후 투표에 적용해요. 예치금 납부·반환·취소
            기준은 모임 구성 후 합의하며, 이 프로토타입에서는 결제하지 않아요.
          </Text>
          {applying ? (
            <>
              <View style={s.divider} />
              <Field
                label="팟장에게 보내는 한마디 (선택)"
                placeholder="비워 둬도 바로 참가할 수 있어요."
                multiline
                value={message}
                onChangeText={setMessage}
                maxLength={500}
              />
              <View style={s.notice}>
                <Text style={s.muted}>
                  별도의 메시지나 동의 체크 없이 참가할 수 있어요. 여행 조건을
                  확인한 뒤 참가를 확정해주세요. 실제 투자와 결제는 진행되지
                  않아요.
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[s.title, s.section]}>이런 여행을 함께해요</Text>
              <Text style={s.body}>
                {pod.description || "자세한 여행 계획은 함께 정해요."}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </Sheet>
  );
}
