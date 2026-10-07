import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Image,
  ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  canConfirm,
  canRequestInvestment,
  totalInvestmentAmount,
  canSubmit,
  hasVoteChanges,
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

import { palette as C } from "./theme";

const STATUS_COLORS = {
  confirmed: { text: C.green, background: C.mint, chart: C.green },
  discussing: { text: "#8A6100", background: "#FFF1BA", chart: "#E4B52F" },
  low: { text: C.muted, background: C.iconBackground, chart: C.muted },
};
const COMPANY_LOGOS: Record<string, ImageSourcePropType> = {
  samsung: require("../reference/삼성전자.png"),
  skhynix: require("../reference/SK하이닉스.png"),
  naver: require("../reference/네이버.png"),
  hyundai: require("../reference/현대자동차.png"),
};
function CompanyLogo({ plan, large = false }: { plan: InvestmentPlan; large?: boolean }) {
  const source = COMPANY_LOGOS[plan.id];
  if (!source) return null;
  return (
    <View style={[s.companyLogo, large && s.planIconLarge, plan.id === "hyundai" && { backgroundColor: C.dark }]}>
      <Image source={source} style={{ width: large ? 54 : 38, height: large ? 46 : 30 }} resizeMode="contain" accessibilityLabel={`${plan.name} 로고`} />
    </View>
  );
}
function PlanIcon({ plan }: { plan: InvestmentPlan }) {
  if (plan.source === "member") return <CompanyLogo plan={plan} large />;
  return (
    <View style={[s.companyLogo, s.planIconLarge, { backgroundColor: C.mint }]} accessible accessibilityLabel={`${plan.name} 아이콘`}>
      {plan.id === "sp500" ? (
        <View style={s.marketIcon}>
          {[14, 23, 34].map((height, i) => <View key={height} style={{ width: 8, height, borderRadius: 2, backgroundColor: C.green, opacity: 0.5 + i * 0.25 }} />)}
        </View>
      ) : plan.id === "bond" ? (
        <View style={s.clockIcon}>
          <View style={s.clockHour} />
          <View style={s.clockMinute} />
        </View>
      ) : (
        <View style={s.coinIcon}>
          <Copy kind="heading" style={{ color: C.green, fontSize: 23 }}>₩</Copy>
        </View>
      )}
    </View>
  );
}
function VotingTimer({ seconds }: { seconds: number }) {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return (
    <View style={s.timerInline} testID="voting-countdown">
      <Copy kind="small" style={{ color: C.muted }}>남은 시간</Copy>
      <Copy style={s.timerNumber}>{hours}:{minutes}:{remainder}</Copy>
    </View>
  );
}
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
        style={{ color: C.bg, fontSize: 16 }}
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
              ? C.muted
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
        disabled && s.buttonDisabled,
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
      style={[s.discussionBadge, { backgroundColor: STATUS_COLORS[status].background }]}
    >
      <Copy kind="small" style={{ fontFamily: "HanaMedium", color: STATUS_COLORS[status].text }}>
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
  const color = STATUS_COLORS[discussionStatus(state, plan.id)].text;
  return (
    <View style={[s.statusRow, prominent && s.prominentStatus]}>
      {prominent ? (
        <View
          style={s.voteTotal}
          accessible
          accessibilityLabel={`${plan.name}, 전체 ${DEMO_CONFIG.pod.members.length}명 중 ${count}명 찬성`}
        >
          <Copy style={{ ...s.voteNumber, color }}>{count}</Copy>
          <Copy kind="label" style={{ color }}>
            명 찬성
          </Copy>
          <Copy kind="small" style={{ color: C.muted }}>
            {" "}
            / {DEMO_CONFIG.pod.members.length}명
          </Copy>
        </View>
      ) : (
        <Copy kind="small" style={{ fontFamily: "HanaMedium", color }}>
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
    <View style={s.cardShadow}>
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
        <View style={s.planContentRow}>
          <PlanIcon plan={plan} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Copy kind="heading">{plan.name}</Copy>
            <Copy kind="small" style={{ color: C.muted, marginTop: 5 }}>{plan.description}</Copy>
          </View>
          <Copy style={{ color: C.muted, fontSize: 22 }}>›</Copy>
        </View>
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
    </View>
  );
}
function InvestmentStyleLabel() {
  return (
    <Copy kind="label" style={{ color: C.ink, fontSize: 17 }}>
      <Copy kind="label" style={{ color: C.green, fontSize: 17 }}>
        {DEMO_CONFIG.pod.investmentStyle}
      </Copy>형 성향
    </Copy>
  );
}
function Facts({ rows, emphasizeValues = false }: { rows: [string, React.ReactNode][]; emphasizeValues?: boolean }) {
  return (
    <View style={s.facts}>
      {rows.map(([label, value]) => (
        <View style={s.fact} key={label}>
          <Copy style={{ color: C.muted, flex: 1 }}>{label}</Copy>
          <Copy kind="label" style={{ flex: 1.4, textAlign: "right", ...(emphasizeValues ? { fontFamily: "HanaBold", fontSize: 18, color: C.ink } : {}) }}>
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
  const [votingEndsAt] = useState(() => Date.now() + DEMO_RULES.votingDurationSeconds * 1000);
  const [remainingSeconds, setRemainingSeconds] = useState(DEMO_RULES.votingDurationSeconds);
  useEffect(() => {
    const tick = () => setRemainingSeconds(Math.max(0, Math.ceil((votingEndsAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [votingEndsAt]);
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
  const totalAmount = totalInvestmentAmount(state);
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
      <KeyboardAvoidingView style={s.shell} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.header}>
          {stack.length > 1 && (
            <Pressable
              testID="go-back"
              accessibilityRole="button"
              accessibilityLabel="이전 화면"
              onPress={back}
              style={s.headerControl}
            >
              <View style={s.backChevron} />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Copy kind="title">
              {title}
            </Copy>
          </View>
        </View>
        <View
          style={s.progress}
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
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[
                s.progressSegment,
                { backgroundColor: n <= step ? C.green : C.line },
              ]}
            />
          ))}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ref={scroll}
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity, gap: 18 }}>
            {screen.name === "list" && (
              <>
                <View style={s.hero}>
                  <Copy kind="small" style={{ color: C.muted }}>
                    {pod.name}
                  </Copy>
                  <View style={s.mascotRow}>
                    <View style={s.mascotCopy}>
                      <Copy
                        kind="heading"
                        style={{ color: C.ink, fontSize: 28, lineHeight: 36 }}
                      >
                        투자안을 함께{"\n"}조율하고 있어요
                      </Copy>
                      <View style={s.styleBadge}>
                        <InvestmentStyleLabel />
                      </View>
                      <Copy
                        kind="small"
                        style={{ color: C.muted, marginTop: 6 }}
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
                      {pod.threshold}명 이상 / 완료
                    </Copy>
                  </View>
                  <View style={s.summaryRow}>
                    <View style={s.summaryItem}>
                      <Copy style={{ ...s.summaryNumber, color: STATUS_COLORS.confirmed.text }}>
                        {counts.confirmed}
                      </Copy>
                      <Copy kind="small">완료</Copy>
                    </View>
                    <View style={s.summaryItem}>
                      <Copy style={{ ...s.summaryNumber, color: STATUS_COLORS.discussing.text }}>
                        {counts.discussing}
                      </Copy>
                      <Copy kind="small">진행 중</Copy>
                    </View>
                    <View style={s.summaryItem}>
                      <Copy style={{ ...s.summaryNumber, color: STATUS_COLORS.low.text }}>
                        {counts.low}
                      </Copy>
                      <Copy kind="small">종료</Copy>
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
                    locked={state.submitted && !DEMO_RULES.allowVoteChangesAfterSubmission}
                    onDetail={() => go({ name: "detail", planId: plan.id })}
                    onSelect={() => toggle(plan.id)}
                  />
                ))}
                <View style={s.sectionDivider} />
                <View style={s.sectionHeading}>
                  <View style={{ flex: 1 }}>
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
                    <Copy style={{ color: "white", fontSize: 20 }}>＋</Copy>
                    <Copy kind="label" style={{ color: "white" }}>
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
                    locked={state.submitted && !DEMO_RULES.allowVoteChangesAfterSubmission}
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
                  <View style={[s.row, { marginTop: 8 }]}><CompanyLogo plan={detail} /><Copy kind="title" style={{ flex: 1 }}>{detail.name}</Copy></View>
                  <Copy kind="small" style={{ color: C.muted, marginTop: 10 }}>
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
                  <Copy kind="heading">투표 현황</Copy>
                  <View style={{ marginTop: 16 }}>
                    <VoteStatus plan={detail} state={state} prominent />
                  </View>
                </View>
              </>
            )}
            {screen.name === "results" && (
              <>
                <View style={s.infoCard}>
                  <View style={s.row}>
                    <Copy kind="heading">전체 투표 현황</Copy>
                    <Copy kind="small" style={{ color: C.muted }}>
                      전체 <Copy style={s.dynamicValue}>{pod.members.length}명</Copy>
                    </Copy>
                  </View>
                  <Copy kind="small" style={{ color: C.muted, marginTop: 5 }}>
                    <Copy style={s.dynamicValue}>{pod.threshold}명</Copy> 이상 찬성 시 완료
                  </Copy>
                  {member?.isRepresentative && (
                    <Copy kind="small" style={{ color: C.muted, marginTop: 5 }}>
                      완료된 종목에서 투자 확인 대상을 선택해주세요
                    </Copy>
                  )}
                  <View style={s.chartLegend}>
                    <View style={s.legendItem}>
                      <View
                        style={[s.legendDot, { backgroundColor: STATUS_COLORS.confirmed.chart }]}
                      />
                      <Copy kind="small">완료</Copy>
                    </View>
                    <View style={s.legendItem}>
                      <View
                        style={[s.legendDot, { backgroundColor: STATUS_COLORS.discussing.chart }]}
                      />
                      <Copy kind="small">진행 중</Copy>
                    </View>
                    <View style={s.legendItem}>
                      <View
                        style={[s.legendDot, { backgroundColor: STATUS_COLORS.low.chart }]}
                      />
                      <Copy kind="small">종료</Copy>
                    </View>
                  </View>
                  {rankedPlans.map((plan) => {
                    const count = voteCount(state, plan.id);
                    const status = discussionStatus(state, plan.id);
                    const color = STATUS_COLORS[status].chart;
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
                                color: STATUS_COLORS[status].text,
                              }}
                            >
                              {status === "confirmed"
                                ? "완료"
                                : status === "discussing"
                                  ? "진행 중"
                                  : "종료"}
                            </Copy>
                            <Copy kind="label" style={{ color: STATUS_COLORS[status].text, fontFamily: "HanaBold", fontSize: 20 }}>
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
                              testID={`threshold-range-${plan.id}`}
                              pointerEvents="none"
                              style={[s.thresholdRange, { width: `${Math.min(1, pod.threshold / pod.members.length) * 100}%` }]}
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
                  {candidates.length === 0 && (
                    <View testID="empty-candidates">
                      <Copy
                        kind="small"
                        style={{ color: C.muted, marginTop: 10 }}
                      >
                        {pod.threshold}명 이상 찬성한 종목이 아직 없어요
                      </Copy>
                    </View>
                  )}
                </View>
              </>
            )}
            {screen.name === "confirm" && canConfirm(state) && (
              <>
                <Copy kind="heading">
                  선택한 투자안 <Copy style={s.dynamicValue}>{selectedForConfirmation.length}개</Copy>를 확인하세요
                </Copy>
                <View style={s.infoCard}>
                  <Copy kind="heading">모임 정보</Copy>
                  <Facts
                    emphasizeValues
                    rows={[
                      ["모임명", pod.name],
                      ["대표자", representative?.name ?? "미지정"],
                      ["투자 성향", <InvestmentStyleLabel key="investment-style" />],
                      ["참여 회원", `${pod.members.length}명`],
                    ]}
                  />
                </View>
                <Copy kind="heading">
                  선택한 투자 후보 <Copy style={s.dynamicValue}>{selectedForConfirmation.length}개</Copy>
                </Copy>
                {selectedForConfirmation.map((plan, i) => (
                  <View style={s.infoCard} key={plan.id}>
                    <View style={s.confirmationPlanHeader}>
                      <View style={{ flex: 1 }}>
                        <Copy kind="small" style={{ color: C.green }}>
                          투자 후보 {String(i + 1).padStart(2, "0")}
                        </Copy>
                        <Copy kind="heading" style={{ marginTop: 6 }}>
                          {plan.name}
                        </Copy>
                      </View>
                      <View
                        style={s.confirmationVotes}
                        accessible
                        accessibilityLabel={`${plan.name}, ${voteCount(state, plan.id)}명 찬성`}
                      >
                        <Copy style={{ ...s.voteNumber, color: STATUS_COLORS.confirmed.text }}>
                          {voteCount(state, plan.id)}
                        </Copy>
                        <Copy kind="small" style={{ color: STATUS_COLORS.confirmed.text }}>
                          명 찬성
                        </Copy>
                      </View>
                    </View>
                    <View style={s.amountEntry}>
                      <Copy kind="label">투자 금액</Copy>
                      <View style={s.amountInputRow}>
                        <TextInput
                          testID={`investment-amount-${plan.id}`}
                          accessibilityLabel={`${plan.name} 투자 금액`}
                          value={state.investmentAmounts[plan.id] ? state.investmentAmounts[plan.id].toLocaleString("ko-KR") : ""}
                          onChangeText={(text) => {
                            const digits = text.replace(/,/g, "");
                            if (!/^\d*$/.test(digits)) return;
                            const amount = digits === "" ? 0 : Number(digits);
                            dispatch({ type: "setInvestmentAmount", planId: plan.id, amount });
                          }}
                          keyboardType="number-pad"
                          inputMode="numeric"
                          placeholder="금액 입력"
                          placeholderTextColor={C.muted}
                          maxLength={17}
                          selectTextOnFocus
                          style={s.amountInput}
                        />
                        <Copy kind="label" style={{ color: C.muted }}>원</Copy>
                      </View>
                    </View>
                  </View>
                ))}
                <View testID="total-investment-amount" style={s.amountCard}>
                  <Copy kind="label" style={{ color: C.muted }}>
                    총 투자 금액
                  </Copy>
                  <Copy style={s.plannedAmount}>
                    {money(totalAmount)}
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
                  {state.selectedPlanIds.length}개 선택
                </Copy>
                <VotingTimer seconds={remainingSeconds} />
              </View>
              <Button
                testID="submit-vote"
                label="투표하기"
                disabled={!canSubmit(state)}
                onPress={submit}
              />
            </>
          )}
          {screen.name === "detail" && detail && (
            <Button
              label={state.selectedPlanIds.includes(detail.id) ? "선택 해제" : "선택하기"}
              onPress={() => toggle(detail.id)}
            />
          )}
          {screen.name === "results" &&
            (member?.isRepresentative ? (
              <>
                <View style={s.row}>
                  <Copy kind="label">
                    투자 확인 대상 <Copy style={s.dynamicValue}>{state.confirmationPlanIds.length}개</Copy>
                  </Copy>
                  <Copy kind="small" style={{ color: C.muted }}>
                    대표자 / {member.name}
                  </Copy>
                </View>
                <Button
                  testID="open-confirmation"
                  label={hasVoteChanges(state) ? "투표 수정 제출" : "투자 확정하기"}
                  disabled={hasVoteChanges(state) ? !canSubmit(state) : !canConfirm(state)}
                  onPress={() => {
                    if (hasVoteChanges(state) && canSubmit(state)) dispatch({ type: "submit" });
                    else if (canConfirm(state)) go({ name: "confirm" });
                  }}
                />
              </>
            ) : (
              <Button
                label={hasVoteChanges(state) ? "투표 수정 제출" : "투자안 목록으로"}
                disabled={hasVoteChanges(state) && !canSubmit(state)}
                onPress={() => {
                  if (hasVoteChanges(state)) dispatch({ type: "submit" });
                  else setStack([{ name: "list" }]);
                }}
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
                disabled={!canRequestInvestment(state)}
                onPress={() => {
                  if (canRequestInvestment(state)) {
                    Keyboard.dismiss();
                    setRequestDialog("confirm");
                    setRequestOpen(true);
                  }
                }}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
              <Image
                source={requestDialog === "sent" ? require("../assets/images/mascot-success-white.png") : require("../reference/04.png")}
                style={s.requestMascot}
                resizeMode="contain"
                accessibilityLabel={requestDialog === "sent" ? "승인 요청 알림 전송을 기뻐하는 하나 마스코트" : "함께 투자 결정을 고민하는 하나 마스코트"}
              />
              <View style={s.requestBubble}>
                <Copy kind="label" style={{ color: C.ink, textAlign: "center" }}>
                  {requestDialog === "sent" ? "알림을\n보냈어요!" : "함께\n결정해요"}
                </Copy>
                <View style={s.requestBubbleTail} />
              </View>
            </View>
            <View style={s.requestContent}>
            <Copy kind="heading" style={{ textAlign: "center", fontSize: 21, lineHeight: 29 }}>
              {requestDialog === "sent"
                ? "승인 요청 알림을 보냈어요"
                : "구성원에게 승인을 요청할까요?"}
            </Copy>
            <Copy kind="small" style={{ color: C.muted, textAlign: "center", marginTop: 10 }}>
              {requestDialog === "sent"
                ? "구성원들의 투자 승인 의견을 기다려주세요."
                : "아래 투자 내용의 승인 요청을\n구성원들에게 보냅니다."}
            </Copy>
            <View style={s.requestSummary} testID="approval-request-summary">
              <View style={s.row}>
                <Copy style={{ color: C.muted }}>선택한 투자안</Copy>
                <Copy style={s.requestSummaryValue}>{selectedForConfirmation.length}개</Copy>
              </View>
              <View style={s.row}>
                <Copy style={{ color: C.muted }}>총 투자 금액</Copy>
                <Copy style={s.requestSummaryValue}>{money(totalAmount)}</Copy>
              </View>
            </View>
            {requestDialog === "confirm" ? (
              <>
                <Button
                  testID="send-approval-request"
                  label="알림 보내기"
                  onPress={() => {
                    if (canRequestInvestment(state)) setRequestDialog("sent");
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
  dynamicValue: { fontFamily: "HanaBold", fontSize: 21, lineHeight: 28, color: C.green },
  planIconLarge: { width: 68, height: 68, borderRadius: 16 },
  planContentRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  marketIcon: { flexDirection: "row", alignItems: "flex-end", gap: 5, height: 36 },
  clockIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 2.5, borderColor: C.green },
  clockHour: { position: "absolute", width: 2.5, height: 12, backgroundColor: C.green, left: 15, top: 5, borderRadius: 2 },
  clockMinute: { position: "absolute", width: 11, height: 2.5, backgroundColor: C.green, left: 15, top: 15, borderRadius: 2 },
  coinIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: C.green, alignItems: "center", justifyContent: "center" },
  cardShadow: {
    backgroundColor: C.card,
    borderRadius: 22,
    ...Platform.select({
      web: { boxShadow: "3px 5px 12px rgba(32,44,48,0.07)" },
      default: { shadowColor: C.dark, shadowOffset: { width: 3, height: 4 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
    }),
  },
  companyLogo: { width: 46, height: 42, borderRadius: 10, backgroundColor: C.iconBackground, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  timerInline: { flexDirection: "row", alignItems: "center", gap: 6 },
  timerNumber: { fontFamily: "HanaBold", fontSize: 15, lineHeight: 20, color: C.dark, fontVariant: ["tabular-nums"] },
  text: { color: C.ink, fontFamily: "HanaRegular" },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 13, lineHeight: 19 },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: "HanaBold",
    letterSpacing: -0.4,
  },
  heading: { fontSize: 19, lineHeight: 27, fontFamily: "HanaBold" },
  label: { fontSize: 16, lineHeight: 24, fontFamily: "HanaMedium" },
  safe: { flex: 1, backgroundColor: Platform.OS === "web" ? C.outside : C.bg },
  shell: { flex: 1, width: "100%", maxWidth: 430, alignSelf: "center", backgroundColor: C.bg },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerControl: {
    width: 44,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  backChevron: {
    width: 14,
    height: 14,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: C.ink,
    transform: [{ rotate: "45deg" }],
    marginLeft: 6,
  },
  addButton: {
    minHeight: 56,
    flexShrink: 0,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 4,
    backgroundColor: C.green,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 20,
  },
  progressSegment: { flex: 1, height: 2, borderRadius: 2 },
  scroll: { flex: 1 },
  content: { padding: 22, paddingTop: 4, paddingBottom: 28 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  hero: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: C.mint,
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
    fontFamily: "HanaBold",
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
  neutralPill: { backgroundColor: C.iconBackground },
  riskPill: { backgroundColor: C.notice },
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
  },
  selectedCard: { borderColor: C.green, borderWidth: 1.5 },
  cardBody: { padding: 20, paddingTop: 12 },
  cardStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  confirmedCard: { borderColor: C.green },
  discussionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  styleBadge: {
    backgroundColor: C.bg,
    borderRadius: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 10,
  },
  livePanel: {
    backgroundColor: C.notice,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  liveHeading: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  summaryRow: { flexDirection: "row", marginTop: 14 },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryNumber: { fontFamily: "HanaBold", fontSize: 26, lineHeight: 32 },
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
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    minHeight: 56,
    paddingHorizontal: 6,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderColor: C.checkBorder,
    borderWidth: 1.5,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: { backgroundColor: C.green, borderColor: C.green },
  bottom: {
    padding: 22,
    paddingTop: 12,
    gap: 10,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  button: {
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.65 },
  infoCard: {
    backgroundColor: C.bg,
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
    borderBottomColor: C.line,
  },
  disclaimer: { color: C.muted, marginTop: 8, lineHeight: 19 },
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
  voteSegment: { flex: 1, backgroundColor: C.line, borderRadius: 3 },
  thresholdRange: {
    position: "absolute",
    left: -2,
    top: -4,
    bottom: -4,
    borderWidth: 1.5,
    borderColor: C.green,
    borderStyle: "dashed",
    borderRadius: 5,
  },
  empty: {
    alignItems: "center",
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.checkBorder,
    backgroundColor: C.bg,
  },
  confirmationPlanHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  confirmationVotes: { flexDirection: "row", alignItems: "baseline", gap: 4, flexShrink: 0 },
  amountEntry: { marginTop: 18, gap: 8 },
  amountInputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg, paddingHorizontal: 14 },
  amountInput: { flex: 1, minWidth: 0, minHeight: 56, fontFamily: "HanaBold", fontSize: 22, color: C.dark, textAlign: "right", paddingVertical: 12 },
  requestSummary: { backgroundColor: C.notice, borderRadius: 14, padding: 14, gap: 12, marginVertical: 18 },
  requestSummaryValue: { fontFamily: "HanaBold", fontSize: 21, lineHeight: 28, color: C.ink, flexShrink: 1, textAlign: "right" },
  amountCard: { padding: 20, borderRadius: 22, backgroundColor: C.notice },
  plannedAmount: {
    color: C.ink,
    fontFamily: "HanaBold",
    fontSize: 38,
    lineHeight: 48,
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
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  requestCard: { padding: 0, overflow: "hidden" },
  requestIllustration: {
    height: 136,
    backgroundColor: C.bg,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
    gap: 10,
  },
  requestMascot: { width: 116, height: 116 },
  requestBubble: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: C.notice,
  },
  requestBubbleTail: {
    position: "absolute",
    left: -5,
    bottom: 16,
    width: 12,
    height: 12,
    backgroundColor: C.notice,
    transform: [{ rotate: "45deg" }],
  },
  requestContent: { padding: 24, paddingTop: 12 },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    backgroundColor: C.bg,
    borderRadius: 24,
  },
});
