import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  canConfirm,
  canSubmit,
  createInitialState,
  currentMember,
  DEMO_CONFIG,
  DEMO_RULES,
  Action,
  DemoState,
  InvestmentPlan,
  isCandidate,
  reduceDemo,
  voteCount,
  discussionStatus,
  DISCUSSION_LABELS,
  LIVE_VOTE_EVENTS,
  STYLE_DESCRIPTIONS,
  proposerName,
} from "./domain";

const C = {
  green: "#008485",
  dark: "#174344",
  ink: "#202F30",
  muted: "#647778",
  mint: "#E7F4F4",
  soft: "#B9C7C6",
  accent: "#D5A24B",
  line: "#E3EBEB",
  bg: "#F5F8F8",
};
type Screen =
  | { name: "list" }
  | { name: "detail"; planId: string }
  | { name: "results" }
  | { name: "confirm" };
const money = (n: number) => `${n.toLocaleString("ko-KR")}원`;
function Copy({
  children,
  style,
  kind = "body",
}: {
  children: React.ReactNode;
  style?: TextStyle;
  kind?: "body" | "small" | "title" | "heading" | "label";
}) {
  return <Text style={[s.text, s[kind], style]}>{children}</Text>;
}
function Button({
  label,
  onPress,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        disabled && s.buttonDisabled,
        pressed && s.pressed,
      ]}
    >
      <Copy
        kind="label"
        style={{ color: disabled ? "#738788" : "#FFFFFF", fontSize: 16 }}
      >
        {label}
      </Copy>
    </Pressable>
  );
}
function Pill({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "neutral" | "risk";
}) {
  return (
    <View
      style={[
        s.pill,
        tone === "neutral" && s.neutralPill,
        tone === "risk" && s.riskPill,
      ]}
    >
      <Copy
        kind="small"
        style={{
          color:
            tone === "risk"
              ? "#7A5843"
              : tone === "neutral"
                ? C.muted
                : C.green,
          fontFamily: "HanaMedium",
        }}
      >
        {children}
      </Copy>
    </View>
  );
}
function Selection({
  selected,
  onPress,
  disabled,
  label,
  testID,
  compact = false,
}: {
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  label: string;
  testID?: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      aria-checked={selected}
      aria-disabled={!!disabled}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.selection,
        compact && s.compactSelection,
        pressed && s.pressed,
      ]}
    >
      <View style={[s.checkbox, selected && s.checked]}>
        <Copy style={{ color: "white", fontSize: 17 }}>
          {selected ? "✓" : ""}
        </Copy>
      </View>
      {!compact && (
        <Copy
          kind="small"
          style={{
            color: selected ? C.green : C.muted,
            fontFamily: "HanaMedium",
          }}
        >
          {selected ? "선택됨" : disabled ? "미선택" : "선택"}
        </Copy>
      )}
    </Pressable>
  );
}
function DiscussionBadge({
  plan,
  state,
}: {
  plan: InvestmentPlan;
  state: DemoState;
}) {
  const status = discussionStatus(state, plan.id);
  return (
    <View
      style={[
        s.discussionBadge,
        status === "confirmed"
          ? s.confirmedBadge
          : status === "discussing"
            ? s.discussingBadge
            : s.lowBadge,
      ]}
    >
      <Copy
        kind="small"
        style={{
          fontFamily: "HanaBold",
          color:
            status === "confirmed"
              ? C.green
              : status === "discussing"
                ? C.green
                : C.muted,
        }}
      >
        {DISCUSSION_LABELS[status]}
      </Copy>
    </View>
  );
}
function VoteStatus({
  plan,
  state,
  prominent = false,
  showStatus = true,
}: {
  plan: InvestmentPlan;
  state: DemoState;
  prominent?: boolean;
  showStatus?: boolean;
}) {
  const count = voteCount(state, plan.id);
  return (
    <View style={[s.statusRow, prominent && s.prominentStatus]}>
      {prominent ? (
        <View
          style={s.voteTotal}
          accessible
          accessibilityLabel={`${plan.name}, 전체 ${DEMO_CONFIG.pod.members.length}명 중 ${count}명 찬성`}
        >
          <Copy style={s.voteNumber}>{count}</Copy>
          <Copy kind="label" style={{ color: C.green }}>
            명 찬성
          </Copy>
          <Copy kind="small" style={{ color: C.muted }}>
            {" "}
            / {DEMO_CONFIG.pod.members.length}명
          </Copy>
        </View>
      ) : (
        <Copy kind="small" style={{ fontFamily: "HanaMedium" }}>
          {count} / {DEMO_CONFIG.pod.members.length}명 투표
        </Copy>
      )}
      {showStatus && <DiscussionBadge plan={plan} state={state} />}
    </View>
  );
}
function Card({
  plan,
  state,
  onDetail,
  onSelect,
  selected,
  locked = false,
  selectable = true,
}: {
  plan: InvestmentPlan;
  state: DemoState;
  onDetail: () => void;
  onSelect: () => void;
  selected: boolean;
  locked?: boolean;
  selectable?: boolean;
}) {
  return (
    <View
      style={[
        s.card,
        isCandidate(state, plan.id) && s.confirmedCard,
        selected && s.selectedCard,
      ]}
    >
      <View style={s.cardStatus}>
        <DiscussionBadge plan={plan} state={state} />
        <Copy kind="small" style={{ color: C.muted }}>
          {plan.source === "member"
            ? `${proposerName(plan)}님 제안`
            : "AI 추천 ETF"}
        </Copy>
      </View>
      <Pressable
        testID={`detail-${plan.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${plan.name} 상세 보기`}
        onPress={onDetail}
        style={({ pressed }) => [s.cardBody, pressed && s.pressed]}
      >
        <View style={s.row}>
          <Copy kind="heading" style={{ flex: 1 }}>
            {plan.name}
          </Copy>
          <Copy style={{ color: C.muted, fontSize: 22 }}>›</Copy>
        </View>
        <Copy style={{ color: C.muted, marginTop: 4 }}>{plan.description}</Copy>
      </Pressable>
      <View style={s.cardFooter}>
        {DEMO_RULES.showExistingVotes || state.submitted ? (
          <View style={{ flex: 1 }}>
            <VoteStatus
              plan={plan}
              state={state}
              prominent
              showStatus={false}
            />
          </View>
        ) : (
          <Copy kind="small">제출 후 득표수 공개</Copy>
        )}
        {selectable && (
          <Selection
            testID={`select-${plan.id}`}
            label={`${plan.name} ${locked ? "제출한 투표" : "선택"}`}
            selected={selected}
            onPress={onSelect}
            disabled={locked}
          />
        )}
      </View>
    </View>
  );
}
function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <View style={s.facts}>
      {rows.map(([label, value]) => (
        <View style={s.fact} key={label}>
          <Copy style={{ color: C.muted, flex: 1 }}>{label}</Copy>
          <Copy kind="label" style={{ flex: 1.4, textAlign: "right" }}>
            {value}
          </Copy>
        </View>
      ))}
    </View>
  );
}

export function InvestmentApp() {
  const { width } = useWindowDimensions();
  const [state, dispatch] = useReducer(
    (previous: DemoState, action: Action) => reduceDemo(previous, action),
    undefined,
    () => createInitialState(),
  );
  const [stack, setStack] = useState<Screen[]>([{ name: "list" }]);
  const [notice, setNotice] = useState(false);
  const [requestDialog, setRequestDialog] = useState<"confirm" | "sent">("confirm");
  const [requestOpen, setRequestOpen] = useState(false);
  const screen = stack[stack.length - 1];
  const opacity = useRef(new Animated.Value(1)).current;
  const scroll = useRef<ScrollView>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pod = DEMO_CONFIG.pod;
  const member = currentMember();
  const aiPlans = DEMO_CONFIG.plans
    .filter((p) => p.source === "ai")
    .slice(0, DEMO_RULES.maximumAiRecommendations);
  const memberPlans = DEMO_CONFIG.plans.filter((p) => p.source === "member");
  const counts = DEMO_CONFIG.plans.reduce(
    (summary, plan) => {
      summary[discussionStatus(state, plan.id)] += 1;
      return summary;
    },
    { confirmed: 0, discussing: 0, low: 0 },
  );
  const representative = pod.members.find((m) => m.isRepresentative);
  const candidates = DEMO_CONFIG.plans.filter((e) => isCandidate(state, e.id));
  const rankedPlans = [...DEMO_CONFIG.plans].sort(
    (a, b) => voteCount(state, b.id) - voteCount(state, a.id),
  );
  const selectedForConfirmation = DEMO_CONFIG.plans.filter((e) =>
    state.confirmationPlanIds.includes(e.id),
  );
  const go = (next: Screen) => setStack((prev) => [...prev, next]);
  const back = () =>
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  useEffect(() => {
    if (!DEMO_RULES.simulateLiveVotes) return;
    let index = 0;
    const timer = setInterval(() => {
      const vote = LIVE_VOTE_EVENTS[index++];
      if (vote) dispatch({ type: "receiveVote", vote });
      if (index >= LIVE_VOTE_EVENTS.length) clearInterval(timer);
    }, DEMO_RULES.liveVoteIntervalMs);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => listener.remove();
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0.5);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [screen, opacity, reduceMotion]);
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (notice) {
        setNotice(false);
        return true;
      }
      if (stack.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [stack.length, notice]);
  const submit = () => {
    if (canSubmit(state)) {
      dispatch({ type: "submit" });
      go({ name: "results" });
    }
  };
  const toggle = (planId: string) =>
    dispatch({ type: "toggleSelection", planId });
  const toggleConfirmation = (planId: string) =>
    dispatch({ type: "toggleConfirmation", planId });
  const step =
    screen.name === "results" ? 2 : screen.name === "confirm" ? 3 : 1;
  const title =
    screen.name === "list"
      ? "투자안 선택"
      : screen.name === "detail"
        ? "투자안 상세"
        : screen.name === "results"
          ? "투표 결과"
          : "투자 확인";
  const detail =
    screen.name === "detail"
      ? DEMO_CONFIG.plans.find((e) => e.id === screen.planId)
      : undefined;

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={s.shell}>
        <View style={s.header}>
          {stack.length > 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 화면"
              onPress={back}
              style={s.headerControl}
            >
              <Copy style={{ fontSize: 30 }}>‹</Copy>
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Copy kind="heading" style={{ fontSize: 22 }}>
              {title}
            </Copy>
          </View>
          <Image
            source={require("../reference/logo.png")}
            style={s.logo}
            resizeMode="contain"
            accessibilityLabel="하나은행 로고"
          />
        </View>
        <View
          style={s.steps}
          accessibilityRole="progressbar"
          role="progressbar"
          aria-label="투자 진행 단계"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step}
          aria-valuetext={`${step}/3단계 / ${title}`}
          accessibilityValue={{
            min: 1,
            max: 3,
            now: step,
            text: `${step}/3단계 / ${title}`,
          }}
        >
          {["투자안 선택", "투표 결과", "투자 확인"].map((label, i) => (
            <View key={label} style={s.step}>
              {i < 2 && (
                <View
                  style={[
                    s.stepConnector,
                    step > i + 1 && s.stepConnectorActive,
                  ]}
                />
              )}
              <View
                style={[
                  s.stepDot,
                  step >= i + 1 && s.stepActive,
                  step === i + 1 && s.stepCurrent,
                ]}
              >
                <Copy
                  kind="label"
                  style={{ color: step >= i + 1 ? "white" : C.muted }}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </Copy>
              </View>
              <Copy
                kind="small"
                style={{
                  color: step === i + 1 ? C.green : C.muted,
                  fontFamily: step === i + 1 ? "HanaBold" : "HanaRegular",
                }}
              >
                {label}
              </Copy>
            </View>
          ))}
        </View>
        <ScrollView
          ref={scroll}
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity, gap: 18 }}>
            {screen.name === "list" && (
              <>
                <View style={s.hero}>
                  <Copy kind="label" style={{ color: "white" }}>
                    {pod.name}
                  </Copy>
                  <View style={s.mascotRow}>
                    <View style={s.mascotCopy}>
                      <Copy
                        kind="heading"
                        style={{ color: "white", fontSize: 23, lineHeight: 32 }}
                      >
                        투자안을 함께{"\n"}조율하고 있어요
                      </Copy>
                      <View style={s.styleBadge}>
                        <Copy
                          kind="label"
                          style={{ color: C.green, fontSize: 17 }}
                        >
                          {pod.investmentStyle}형 투자
                        </Copy>
                      </View>
                      <Copy
                        kind="small"
                        style={{ color: "white", marginTop: 6 }}
                      >
                        {STYLE_DESCRIPTIONS[pod.investmentStyle]}
                      </Copy>
                    </View>
                    <Image
                      source={require("../assets/images/mascot-hd.png")}
                      style={[
                        s.mascot,
                        width < 360 && { width: 68, height: 128 },
                      ]}
                      resizeMode="contain"
                      accessibilityLabel="투자안을 함께 조율하는 하나 마스코트"
                    />
                  </View>
                </View>
                <View style={s.livePanel}>
                  <View style={s.row}>
                    <View style={s.liveHeading}>
                      <View style={s.liveDot} />
                      <Copy kind="label">투표 현황</Copy>
                    </View>
                    <Copy kind="small" style={{ color: C.muted }}>
                      {pod.threshold + 1}명 이상 / 후보 확정
                    </Copy>
                  </View>
                  <View style={s.summaryRow}>
                    <View style={s.summaryItem}>
                      <Copy style={{ ...s.summaryNumber, color: C.green }}>
                        {counts.confirmed}
                      </Copy>
                      <Copy kind="small">후보 확정</Copy>
                    </View>
                    <View style={s.summaryItem}>
                      <Copy style={{ ...s.summaryNumber, color: "#8B5D14" }}>
                        {counts.discussing}
                      </Copy>
                      <Copy kind="small">논의 중</Copy>
                    </View>
                    <View style={s.summaryItem}>
                      <Copy style={{ ...s.summaryNumber, color: C.muted }}>
                        {counts.low}
                      </Copy>
                      <Copy kind="small">관심 낮음</Copy>
                    </View>
                  </View>
                  {state.latestVote && (
                    <View accessibilityLiveRegion="polite">
                      <Copy
                        kind="small"
                        style={{ color: C.green, marginTop: 10 }}
                      >
                        {
                          DEMO_CONFIG.plans.find(
                            (p) => p.id === state.latestVote?.planId,
                          )?.name
                        }
                        에 새 찬성이 반영됐어요
                      </Copy>
                    </View>
                  )}
                </View>
                {state.submitted && (
                  <View style={s.notice}>
                    <Copy kind="label" style={{ color: C.green }}>
                      ✓ 투표 제출 완료 / 선택 변경 불가
                    </Copy>
                  </View>
                )}
                <View style={s.sectionHeading}>
                  <Copy kind="heading">AI 추천 투자안</Copy>
                  <Pill>{aiPlans.length}개</Pill>
                </View>
                {aiPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    plan={plan}
                    state={state}
                    selected={state.selectedPlanIds.includes(plan.id)}
                    locked={state.submitted}
                    onDetail={() => go({ name: "detail", planId: plan.id })}
                    onSelect={() => toggle(plan.id)}
                  />
                ))}
                <View style={s.sectionDivider} />
                <View style={s.sectionHeading}>
                  <View>
                    <Copy kind="heading">모임원의 개별 투자안</Copy>
                    <Copy kind="small" style={{ color: C.muted, marginTop: 4 }}>
                      모임원이 제안한 국내 주식 {memberPlans.length}개
                    </Copy>
                  </View>
                  <Pressable
                    testID="add-proposal"
                    accessibilityRole="button"
                    accessibilityLabel="직접 투자안 만들기"
                    onPress={() => setNotice(true)}
                    style={s.addButton}
                  >
                    <Copy style={{ color: C.green, fontSize: 20 }}>＋</Copy>
                    <Copy kind="label" style={{ color: C.green }}>
                      제안하기
                    </Copy>
                  </Pressable>
                </View>
                {memberPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    plan={plan}
                    state={state}
                    selected={state.selectedPlanIds.includes(plan.id)}
                    locked={state.submitted}
                    onDetail={() => go({ name: "detail", planId: plan.id })}
                    onSelect={() => toggle(plan.id)}
                  />
                ))}
                <Copy kind="small" style={s.disclaimer}>
                  상품 정보 / AI 추천은 시연용입니다.
                </Copy>
              </>
            )}
            {screen.name === "detail" && detail && (
              <>
                <View style={s.detailHero}>
                  <Copy kind="small" style={{ color: C.muted }}>
                    {detail.code} / {detail.category}
                  </Copy>
                  <Copy kind="title" style={{ marginTop: 8 }}>
                    {detail.name}
                  </Copy>
                  <Copy style={{ color: C.muted, marginTop: 10 }}>
                    {detail.description}
                  </Copy>
                  <View style={{ alignSelf: "flex-start", marginTop: 16 }}>
                    <Pill tone="risk">
                      {detail.assetType === "etf"
                        ? `${detail.risk} / ${detail.riskLevel}등급`
                        : "개별 주식 / 가격 변동 위험"}
                    </Pill>
                  </View>
                </View>
                <View style={s.infoCard}>
                  <Copy kind="label" style={{ color: C.green }}>
                    {detail.source === "ai"
                      ? "AI 추천 이유"
                      : `${proposerName(detail)}님의 제안 이유`}
                  </Copy>
                  <Copy style={{ marginTop: 10 }}>{detail.reason}</Copy>
                </View>
                <View style={s.infoCard}>
                  <Copy kind="heading">주요 특징</Copy>
                  {detail.features.map((feature, i) => (
                    <View style={s.feature} key={feature}>
                      <View style={s.featureDot}>
                        <Copy kind="small" style={{ color: C.green }}>
                          {i + 1}
                        </Copy>
                      </View>
                      <Copy style={{ flex: 1 }}>{feature}</Copy>
                    </View>
                  ))}
                </View>
                <View style={s.infoCard}>
                  <Copy kind="heading">상품 기본 정보</Copy>
                  <Facts
                    rows={
                      detail.assetType === "etf"
                        ? [
                            ["기초지수", detail.benchmark],
                            ["총보수", detail.annualFee],
                            ["운용사", detail.manager],
                            ["거래 / 환율", detail.currency],
                          ]
                        : [
                            ["종목 코드", detail.code],
                            ["시장", detail.exchange],
                            ["업종", detail.sector],
                            ["제안한 회원", proposerName(detail)],
                          ]
                    }
                  />
                  <Copy kind="small" style={s.disclaimer}>
                    {detail.assetType === "etf"
                      ? "시연용 상품 정보 / 총보수 외 추가 비용 발생 가능"
                      : "회원의 제안 이유와 투표는 시연용 정보입니다"}
                  </Copy>
                </View>
                <View style={s.infoCard}>
                  <Copy kind="heading">모임의 투표 현황</Copy>
                  <View style={{ marginVertical: 16 }}>
                    <VoteStatus plan={detail} state={state} prominent />
                  </View>
                  <Copy>
                    {pod.threshold}명 초과, {pod.threshold + 1}명 이상 득표 시
                    후보 등록
                  </Copy>
                  <Copy kind="small" style={{ color: C.muted, marginTop: 8 }}>
                    후보 등록은 최종 승인이나 주문이 아닙니다.
                  </Copy>
                  {state.submitted && (
                    <Copy
                      kind="label"
                      style={{ marginTop: 12, color: C.green }}
                    >
                      {state.selectedPlanIds.includes(detail.id)
                        ? "✓ 내가 투표한 투자안"
                        : "투표 제출 완료 / 내가 선택하지 않은 투자안"}
                    </Copy>
                  )}
                </View>
              </>
            )}
            {screen.name === "results" && (
              <>
                <View style={s.infoCard}>
                  <View style={s.row}>
                    <Copy kind="heading">전체 투표 현황</Copy>
                    <Copy kind="small" style={{ color: C.muted }}>
                      전체 {pod.members.length}명
                    </Copy>
                  </View>
                  <Copy kind="small" style={{ color: C.muted, marginTop: 5 }}>
                    {pod.threshold + 1}명 이상 찬성 시 후보 확정
                  </Copy>
                  {member?.isRepresentative && (
                    <Copy kind="small" style={{ color: C.muted, marginTop: 5 }}>
                      확정된 종목에서 투자 확인 대상을 선택해주세요
                    </Copy>
                  )}
                  <View style={s.chartLegend}>
                    <View style={s.legendItem}>
                      <View
                        style={[s.legendDot, { backgroundColor: C.green }]}
                      />
                      <Copy kind="small">후보 확정</Copy>
                    </View>
                    <View style={s.legendItem}>
                      <View
                        style={[s.legendDot, { backgroundColor: C.accent }]}
                      />
                      <Copy kind="small">논의 중</Copy>
                    </View>
                    <View style={s.legendItem}>
                      <View
                        style={[s.legendDot, { backgroundColor: C.soft }]}
                      />
                      <Copy kind="small">관심 낮음</Copy>
                    </View>
                  </View>
                  {rankedPlans.map((plan) => {
                    const count = voteCount(state, plan.id);
                    const status = discussionStatus(state, plan.id);
                    const color =
                      status === "confirmed"
                        ? C.green
                        : status === "discussing"
                          ? C.accent
                          : C.soft;
                    return (
                      <View
                        key={plan.id}
                        style={[
                          s.chartItem,
                          state.confirmationPlanIds.includes(plan.id) &&
                            s.chartItemSelected,
                        ]}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${plan.name}, ${count}명 찬성, ${DISCUSSION_LABELS[status]}, 상세 보기`}
                          onPress={() =>
                            go({ name: "detail", planId: plan.id })
                          }
                          style={({ pressed }) => [
                            s.chartRow,
                            { flex: 1 },
                            pressed && s.pressed,
                          ]}
                        >
                          <View style={s.row}>
                            <Copy kind="label" style={{ flex: 1 }}>
                              {plan.name}
                              {state.selectedPlanIds.includes(plan.id)
                                ? " ✓"
                                : ""}
                            </Copy>
                            <Copy
                              kind="small"
                              style={{
                                color:
                                  status === "low"
                                    ? C.muted
                                    : status === "discussing"
                                      ? "#8B5D14"
                                      : C.green,
                              }}
                            >
                              {status === "confirmed"
                                ? "후보 확정"
                                : status === "discussing"
                                  ? "논의 중"
                                  : "관심 낮음"}
                            </Copy>
                            <Copy kind="label" style={{ color: C.green }}>
                              {count}명
                            </Copy>
                          </View>
                          <View style={s.voteSegments}>
                            {pod.members.map((voter, index) => (
                              <View
                                key={voter.id}
                                style={[
                                  s.voteSegment,
                                  index < count && { backgroundColor: color },
                                ]}
                              />
                            ))}
                            <View
                              style={[
                                s.thresholdMarker,
                                {
                                  left: `${((pod.threshold + 1) / pod.members.length) * 100}%`,
                                },
                              ]}
                            />
                          </View>
                        </Pressable>
                        {member?.isRepresentative &&
                          (status === "confirmed" ? (
                            <Selection
                              compact
                              testID={`candidate-${plan.id}`}
                              label={`${plan.name} 투자 확인 대상으로 선택`}
                              selected={state.confirmationPlanIds.includes(
                                plan.id,
                              )}
                              onPress={() => toggleConfirmation(plan.id)}
                            />
                          ) : (
                            <View style={{ width: 44 }} />
                          ))}
                      </View>
                    );
                  })}
                  <Copy kind="small" style={{ color: C.muted, marginTop: 12 }}>
                    점선 = 후보 기준
                  </Copy>
                  {candidates.length === 0 && (
                    <View testID="empty-candidates">
                      <Copy
                        kind="small"
                        style={{ color: C.muted, marginTop: 10 }}
                      >
                        {pod.threshold + 1}명 이상 찬성한 종목이 아직 없어요
                      </Copy>
                    </View>
                  )}
                </View>
              </>
            )}
            {screen.name === "confirm" && canConfirm(state) && (
              <>
                <Copy kind="heading">
                  선택한 투자안 {selectedForConfirmation.length}개를 확인하세요
                </Copy>
                <View style={s.infoCard}>
                  <Copy kind="heading">모임 정보</Copy>
                  <Facts
                    rows={[
                      ["모임명", pod.name],
                      ["대표자", representative?.name ?? "미지정"],
                      ["투자 성향", pod.investmentStyle],
                      ["참여 회원", `${pod.members.length}명`],
                    ]}
                  />
                </View>
                <Copy kind="heading">
                  선택한 투자 후보 {selectedForConfirmation.length}개
                </Copy>
                {selectedForConfirmation.map((plan, i) => (
                  <View style={s.infoCard} key={plan.id}>
                    <Copy kind="small" style={{ color: C.green }}>
                      투자 후보 {String(i + 1).padStart(2, "0")}
                    </Copy>
                    <Copy kind="heading" style={{ marginTop: 8 }}>
                      {plan.name}
                    </Copy>
                    <Copy style={{ color: C.muted, marginTop: 6 }}>
                      {plan.category}
                    </Copy>
                    <View style={{ marginTop: 14 }}>
                      <VoteStatus plan={plan} state={state} prominent />
                    </View>
                    <Copy
                      kind="small"
                      style={{ color: C.muted, marginTop: 12 }}
                    >
                      {voteCount(state, plan.id)}명이 투표해 기준{" "}
                      {pod.threshold}
                      명을 초과했어요.
                    </Copy>
                  </View>
                ))}
                <View testID="planned-amount" style={s.amountCard}>
                  <Copy kind="label" style={{ color: "white" }}>
                    투자 예정 금액
                  </Copy>
                  <Copy style={s.plannedAmount}>
                    {money(pod.plannedInvestmentAmount)}
                  </Copy>
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>
        <View style={s.bottom}>
          {screen.name === "list" && (
            <>
              <View style={s.row}>
                <Copy kind="label">
                  {state.submitted
                    ? "투표 제출 완료"
                    : `${state.selectedPlanIds.length}개 선택`}
                </Copy>
                <Copy kind="small" style={{ color: C.muted }}>
                  {state.submitted ? "선택 변경 불가" : "복수 선택 가능"}
                </Copy>
              </View>
              <Button
                testID="submit-vote"
                label={state.submitted ? "투표 결과 보기" : "투표 제출"}
                disabled={!state.submitted && !canSubmit(state)}
                onPress={
                  state.submitted ? () => go({ name: "results" }) : submit
                }
              />
            </>
          )}
          {screen.name === "detail" && detail && (
            <>
              {state.submitted && (
                <Copy kind="small" style={{ color: C.muted }}>
                  제출한 투표는 수정할 수 없어요
                </Copy>
              )}
              <Button
                label={
                  state.submitted
                    ? "이전 화면으로"
                    : state.selectedPlanIds.includes(detail.id)
                      ? "선택 해제"
                      : "선택하기"
                }
                onPress={state.submitted ? back : () => toggle(detail.id)}
              />
            </>
          )}
          {screen.name === "results" &&
            (member?.isRepresentative ? (
              <>
                <View style={s.row}>
                  <Copy kind="label">
                    투자 확인 대상 {state.confirmationPlanIds.length}개
                  </Copy>
                  <Copy kind="small" style={{ color: C.muted }}>
                    대표자 / {member.name}
                  </Copy>
                </View>
                <Button
                  testID="open-confirmation"
                  label="투자 확인으로"
                  disabled={!canConfirm(state)}
                  onPress={() => {
                    if (canConfirm(state)) go({ name: "confirm" });
                  }}
                />
              </>
            ) : (
              <Button
                label="투자안 목록으로"
                onPress={() => setStack([{ name: "list" }])}
              />
            ))}
          {screen.name === "confirm" && (
            <>
              <Pressable
                testID="change-candidates"
                accessibilityRole="button"
                onPress={back}
                style={s.secondaryButton}
              >
                <Copy kind="label" style={{ color: C.muted }}>선택 변경</Copy>
              </Pressable>
              <Button
                testID="request-investment"
                label="투자 실행 요청하기"
                disabled={!canConfirm(state)}
                onPress={() => {
                  if (canConfirm(state)) {
                    setRequestDialog("confirm");
                    setRequestOpen(true);
                  }
                }}
              />
            </>
          )}
        </View>
      </View>
      <Modal
        visible={notice}
        transparent
        animationType="fade"
        onRequestClose={() => setNotice(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Copy kind="heading">직접 투자안 만들기는 준비 중입니다</Copy>
            <Copy style={{ color: C.muted, marginVertical: 16 }}>
              추천 투자안에서 선택해주세요.
            </Copy>
            <Button label="확인" onPress={() => setNotice(false)} />
          </View>
        </View>
      </Modal>
      <Modal
        visible={requestOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, s.requestCard]} accessibilityViewIsModal>
            <View style={s.requestIllustration}>
              <View style={s.requestBubble}>
                <Copy kind="label" style={{ color: C.ink, textAlign: "center" }}>
                  {requestDialog === "sent" ? "알림을\n보냈어요!" : "함께\n결정해요"}
                </Copy>
                <View style={s.requestBubbleTail} />
              </View>
              <Image
                source={
                  requestDialog === "sent"
                    ? require("../assets/images/mascot-success-white.png")
                    : require("../reference/04.png")
                }
                style={s.requestMascot}
                resizeMode="contain"
                accessibilityLabel={
                  requestDialog === "sent"
                    ? "승인 요청 알림 전송을 기뻐하는 하나 마스코트"
                    : "함께 투자 결정을 고민하는 하나 마스코트"
                }
              />
            </View>
            <View style={s.requestContent}>
            <Copy kind="heading" style={{ textAlign: "center", fontSize: 21, lineHeight: 29 }}>
              {requestDialog === "sent"
                ? "승인 요청 알림을 보냈어요"
                : "구성원에게 승인을 요청할까요?"}
            </Copy>
            <Copy style={{ color: C.muted, textAlign: "center", marginTop: 12, marginBottom: 20 }}>
              {requestDialog === "sent"
                ? "구성원들의 투자 승인 의견을 기다려주세요."
                : `선택한 투자안 ${selectedForConfirmation.length}개와 투자 예정 금액 ${money(pod.plannedInvestmentAmount)}에 대한 승인 요청 알림을 구성원들에게 보냅니다.`}
            </Copy>
            {requestDialog === "confirm" ? (
              <>
                <Button
                  testID="send-approval-request"
                  label="알림 보내기"
                  onPress={() => {
                    if (canConfirm(state)) setRequestDialog("sent");
                  }}
                />
                <Pressable
                  testID="cancel-approval-request"
                  accessibilityRole="button"
                  onPress={() => setRequestOpen(false)}
                  style={s.secondaryButton}
                >
                  <Copy kind="label" style={{ color: C.muted }}>취소</Copy>
                </Pressable>
              </>
            ) : (
              <Button label="확인" onPress={() => setRequestOpen(false)} />
            )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  text: { color: C.ink, fontFamily: "HanaRegular" },
  body: { fontSize: 14, lineHeight: 21 },
  small: { fontSize: 12, lineHeight: 18 },
  title: {
    fontSize: 27,
    lineHeight: 36,
    fontFamily: "HanaHeavy",
    letterSpacing: -0.4,
  },
  heading: { fontSize: 19, lineHeight: 27, fontFamily: "HanaBold" },
  label: { fontSize: 14, lineHeight: 21, fontFamily: "HanaMedium" },
  safe: { flex: 1, backgroundColor: C.bg },
  shell: { flex: 1, width: "100%", maxWidth: 520, alignSelf: "center" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerControl: {
    width: 36,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 36, height: 40, marginLeft: "auto", flexShrink: 0 },
  addButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 4,
    backgroundColor: C.mint,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  steps: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 4,
  },
  step: { flex: 1, alignItems: "center", gap: 7 },
  stepConnector: {
    position: "absolute",
    top: 16,
    left: "50%",
    right: "-50%",
    marginHorizontal: 20,
    borderTopWidth: 2,
    borderColor: "#B7CCCC",
    borderStyle: "dashed",
  },
  stepConnectorActive: { borderColor: C.green },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2EBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  stepActive: { backgroundColor: C.green },
  stepCurrent: { borderWidth: 3, borderColor: "#BCE4E4" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 4, paddingBottom: 28 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  hero: {
    padding: 18,
    paddingBottom: 12,
    borderRadius: 20,
    backgroundColor: C.green,
  },
  mascotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  mascotCopy: { flex: 1 },
  mascot: { width: 84, height: 140, flexShrink: 0 },
  prominentStatus: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  voteTotal: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  voteNumber: {
    color: C.green,
    fontFamily: "HanaHeavy",
    fontSize: 32,
    lineHeight: 38,
  },
  pill: {
    backgroundColor: C.mint,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  neutralPill: { backgroundColor: "#EFF3F3" },
  riskPill: { backgroundColor: "#F8EFE8" },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
  },
  selectedCard: { borderColor: C.green, borderWidth: 1.5 },
  cardBody: { padding: 16, paddingTop: 8 },
  cardStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  confirmedCard: { backgroundColor: "#F2FBF9", borderColor: C.green },
  discussionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  confirmedBadge: { backgroundColor: "#DDF3EF" },
  discussingBadge: { backgroundColor: "#FFF2D9" },
  lowBadge: { backgroundColor: "#EFF3F3" },
  styleBadge: {
    backgroundColor: "white",
    borderRadius: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 10,
  },
  livePanel: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  liveHeading: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  summaryRow: { flexDirection: "row", marginTop: 14 },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryNumber: { fontFamily: "HanaHeavy", fontSize: 26, lineHeight: 32 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionDivider: { height: 1, backgroundColor: C.line, marginVertical: 2 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    flexWrap: "wrap",
  },
  selection: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 44,
    paddingHorizontal: 6,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderColor: "#B7CCCC",
    borderWidth: 1.5,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: C.green, borderColor: C.green },
  bottom: {
    padding: 18,
    paddingTop: 12,
    gap: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  button: {
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { backgroundColor: "#E2EEEE" },
  pressed: { opacity: 0.65 },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.line,
  },
  detailHero: { paddingVertical: 12, gap: 2, alignItems: "flex-start" },
  feature: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    alignItems: "flex-start",
  },
  featureDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  facts: { marginTop: 12 },
  fact: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F3",
  },
  disclaimer: { color: C.muted, marginTop: 8, lineHeight: 19 },
  notice: { padding: 18, backgroundColor: C.mint, borderRadius: 16 },
  chartItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
  },
  chartItemSelected: { backgroundColor: C.mint },
  compactSelection: {
    width: 44,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  chartLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 3 },
  chartRow: { paddingVertical: 8, gap: 6 },
  voteSegments: { flexDirection: "row", gap: 4, height: 10, marginVertical: 2 },
  voteSegment: { flex: 1, backgroundColor: "#EEF3F3", borderRadius: 3 },
  thresholdMarker: {
    position: "absolute",
    top: -3,
    bottom: -3,
    borderLeftWidth: 1.5,
    borderColor: C.green,
    borderStyle: "dashed",
  },
  empty: {
    alignItems: "center",
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B7CCCC",
    backgroundColor: "white",
  },
  amountCard: { padding: 24, borderRadius: 20, backgroundColor: C.green },
  plannedAmount: {
    color: "white",
    fontFamily: "HanaHeavy",
    fontSize: 40,
    lineHeight: 52,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 35, 36, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  requestCard: { padding: 0, overflow: "hidden" },
  requestIllustration: {
    height: 156,
    backgroundColor: "white",
    overflow: "hidden",
  },
  requestMascot: {
    position: "absolute",
    width: 146,
    height: 146,
    bottom: -2,
    left: 20,
  },
  requestBubble: {
    position: "absolute",
    right: 24,
    top: 38,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: "#F5F3EE",
  },
  requestBubbleTail: {
    position: "absolute",
    left: -5,
    bottom: 16,
    width: 12,
    height: 12,
    backgroundColor: "#F5F3EE",
    transform: [{ rotate: "45deg" }],
  },
  requestContent: { padding: 24 },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: "white",
    borderRadius: 24,
  },
});
