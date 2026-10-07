/** All demo rules, data and state live here. No financial API or persistent storage. */
export type InvestmentStyle = "안정" | "균형" | "공격";
export type Member = { id: string; name: string; isRepresentative: boolean };
export type Pod = {
  id: string;
  name: string;
  investmentStyle: InvestmentStyle;
  availableAmount: number;
  threshold: number;
  members: Member[];
};
type PlanBase = {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  risk: string;
  riskLevel: number;
  reason: string;
  features: string[];
  currency: string;
};
export type InvestmentPlan = PlanBase &
  (
    | {
        assetType: "etf";
        source: "ai";
        annualFee: string;
        benchmark: string;
        manager: string;
      }
    | {
        assetType: "stock";
        source: "member";
        proposedBy: string;
        sector: string;
        exchange: string;
      }
  );
export type Vote = { memberId: string; planId: string };
export type DemoState = {
  votes: Vote[];
  selectedPlanIds: string[];
  confirmationPlanIds: string[];
  investmentAmounts: Record<string, number>;
  submitted: boolean;
  latestVote: Vote | null;
};
export type DemoConfig = {
  pod: Pod;
  plans: InvestmentPlan[];
  currentMemberId: string;
};
export const DEMO_RULES = {
  minimumSelections: 1,
  maximumAiRecommendations: 3,
  simulateLiveVotes: false,
  liveVoteIntervalMs: 8000,
  votingDurationSeconds: 2 * 60 * 60 + 30 * 60,
  maximumSelections: null as number | null,
  showExistingVotes: true,
  allowVoteChangesAfterSubmission: true,
  allowMultipleConfirmation: true,
};
export const POD: Pod = {
  id: "weekend-pod",
  name: "차곡차곡 투자 모임",
  investmentStyle: "균형",
  availableAmount: 3000000,
  threshold: 3,
  members: [
    { id: "m1", name: "김하나", isRepresentative: true },
    { id: "m2", name: "이준", isRepresentative: false },
    { id: "m3", name: "박서연", isRepresentative: false },
    { id: "m4", name: "최민수", isRepresentative: false },
    { id: "m5", name: "정유진", isRepresentative: false },
    { id: "m6", name: "오지호", isRepresentative: false },
  ],
};
export const STYLE_DESCRIPTIONS: Record<InvestmentStyle, string> = {
  안정: "변동성을 낮추고 안정성을 우선해요",
  균형: "안정성과 성장 가능성을 함께 고려해요",
  공격: "높은 변동성을 감수하며 성장을 추구해요",
};
// Product-like sample facts, not live quotes or verified fund disclosures.
export const AI_PLANS: InvestmentPlan[] = [
  {
    assetType: "etf",
    source: "ai",
    id: "sp500",
    name: "미국 S&P500",
    code: "POD 001",
    category: "미국 대표 기업",
    description: "미국 대표 대형주 500개에 분산 투자",
    risk: "높은 위험",
    riskLevel: 2,
    reason: "미국 시장에 넓게 분산해 모임의 성장 자산으로 담기 좋아요.",
    features: [
      "미국 대형주 시장 전반에 분산 투자",
      "원화로 거래하는 해외 주식형 ETF",
      "환율 변동에 따라 원화 가치가 달라질 수 있어요",
    ],
    annualFee: "연 0.07%",
    benchmark: "S&P 500 Index",
    manager: "하나자산운용 (예시)",
    currency: "원화 / 환노출",
  },
  {
    assetType: "etf",
    source: "ai",
    id: "bond",
    name: "초단기 채권",
    code: "POD 002",
    category: "원화 단기채",
    description: "3개월 이내 우량 단기채 투자",
    risk: "낮은 위험",
    riskLevel: 5,
    reason: "여행 전 짧은 준비 기간을 고려해 만기가 짧은 채권을 살펴봐요.",
    features: [
      "만기 3개월 이내의 우량 단기채 중심으로 구성해요",
      "3년 만기 국채보다 금리 변동에 대한 노출 기간이 짧아요",
      "단기채도 가격 변동과 원금 손실이 발생할 수 있어요",
    ],
    annualFee: "연 0.15%",
    benchmark: "원화 초단기 우량채 지수",
    manager: "하나자산운용 (예시)",
    currency: "원화",
  },
  {
    assetType: "etf",
    source: "ai",
    id: "dividend",
    name: "글로벌 배당 우량주",
    code: "POD 003",
    category: "글로벌 배당주",
    description: "글로벌 배당 우량 기업에 분산 투자",
    risk: "다소 높은 위험",
    riskLevel: 3,
    reason: "배당과 성장을 함께 살피는 균형 성향의 모임에 어울려요.",
    features: [
      "여러 국가의 배당 기업에 분산 투자",
      "분배금 규모와 지급은 보장되지 않아요",
      "주가와 환율 변동의 영향을 받아요",
    ],
    annualFee: "연 0.25%",
    benchmark: "글로벌 배당 우량주 지수",
    manager: "하나자산운용 (예시)",
    currency: "원화 / 환노출",
  },
];
export const STOCK_PLANS: InvestmentPlan[] = [
  {
    id: "samsung",
    assetType: "stock",
    source: "member",
    proposedBy: "m2",
    name: "삼성전자",
    code: "005930",
    category: "국내 주식 / 반도체",
    description: "반도체와 모바일 기기를 만드는 기업",
    risk: "개별 종목 위험",
    riskLevel: 2,
    reason:
      "반도체와 모바일 사업을 함께 가진 기업이라 장기 관점에서 살펴보고 싶어요.",
    features: [
      "반도체와 모바일 기기 등 여러 사업을 운영해요",
      "반도체 업황과 글로벌 수요의 영향을 받아요",
      "개별 기업의 주가는 크게 변동할 수 있어요",
    ],
    sector: "반도체 / 전자",
    exchange: "코스피",
    currency: "원화",
  },
  {
    id: "skhynix",
    assetType: "stock",
    source: "member",
    proposedBy: "m3",
    name: "SK하이닉스",
    code: "000660",
    category: "국내 주식 / 반도체",
    description: "메모리 반도체를 만드는 기업",
    risk: "개별 종목 위험",
    riskLevel: 2,
    reason: "메모리 반도체의 성장 가능성을 함께 논의해보고 싶어요.",
    features: [
      "메모리 반도체를 중심으로 사업을 운영해요",
      "반도체 수요와 가격 변동의 영향을 받아요",
      "한 업종에 대한 집중 위험을 고려해야 해요",
    ],
    sector: "메모리 반도체",
    exchange: "코스피",
    currency: "원화",
  },
  {
    id: "naver",
    assetType: "stock",
    source: "member",
    proposedBy: "m4",
    name: "NAVER",
    code: "035420",
    category: "국내 주식 / 플랫폼",
    description: "검색과 커머스 서비스를 제공하는 기업",
    risk: "개별 종목 위험",
    riskLevel: 2,
    reason:
      "일상에서 사용하는 플랫폼의 사업을 모임원들과 함께 살펴보고 싶어요.",
    features: [
      "검색과 커머스 등 인터넷 서비스를 운영해요",
      "서비스 경쟁과 규제의 영향을 받을 수 있어요",
      "실적 변화에 따라 주가가 변동할 수 있어요",
    ],
    sector: "인터넷 플랫폼",
    exchange: "코스피",
    currency: "원화",
  },
  {
    id: "hyundai",
    assetType: "stock",
    source: "member",
    proposedBy: "m5",
    name: "현대자동차",
    code: "005380",
    category: "국내 주식 / 자동차",
    description: "자동차와 모빌리티 사업을 운영하는 기업",
    risk: "개별 종목 위험",
    riskLevel: 2,
    reason: "글로벌 자동차 사업을 다른 업종과 함께 비교해보고 싶어요.",
    features: [
      "완성차와 모빌리티 사업을 운영해요",
      "자동차 수요와 환율의 영향을 받아요",
      "개별 종목에 대한 투자 위험을 고려해야 해요",
    ],
    sector: "자동차",
    exchange: "코스피",
    currency: "원화",
  },
];
export const PLANS: InvestmentPlan[] = [
  ...AI_PLANS.slice(0, DEMO_RULES.maximumAiRecommendations),
  ...STOCK_PLANS,
];
export const LIVE_VOTE_EVENTS: Vote[] = [
  { memberId: "m6", planId: "bond" },
  { memberId: "m4", planId: "skhynix" },
  { memberId: "m6", planId: "sp500" },
  { memberId: "m6", planId: "samsung" },
];
export const DEMO_CONFIG: DemoConfig = {
  pod: POD,
  plans: PLANS,
  currentMemberId: "m1",
};
export const INITIAL_VOTES: Vote[] = [
  ...["m2", "m3", "m4", "m5"].map((memberId) => ({
    memberId,
    planId: "sp500",
  })),
  ...["m2", "m4"].map((memberId) => ({ memberId, planId: "bond" })),
  { memberId: "m3", planId: "dividend" },
  ...["m2", "m3", "m4", "m5"].map((memberId) => ({
    memberId,
    planId: "samsung",
  })),
  ...["m2", "m3"].map((memberId) => ({ memberId, planId: "skhynix" })),
  ...["m3", "m4"].map((memberId) => ({ memberId, planId: "naver" })),
];
export function createInitialState(votes: Vote[] = INITIAL_VOTES): DemoState {
  return {
    votes: votes.map((v) => ({ ...v })),
    selectedPlanIds: [],
    confirmationPlanIds: [],
    investmentAmounts: {},
    submitted: false,
    latestVote: null,
  };
}
export function currentMember(config = DEMO_CONFIG) {
  return config.pod.members.find((m) => m.id === config.currentMemberId);
}
export function voteCount(
  state: DemoState,
  planId: string,
  config = DEMO_CONFIG,
) {
  const memberIds = new Set(config.pod.members.map((m) => m.id));
  return new Set(
    state.votes
      .filter((v) => v.planId === planId && memberIds.has(v.memberId))
      .map((v) => v.memberId),
  ).size;
}
export function isCandidate(
  state: DemoState,
  planId: string,
  config = DEMO_CONFIG,
) {
  return (
    config.plans.some((e) => e.id === planId) &&
    voteCount(state, planId, config) > config.pod.threshold
  );
}
export type DiscussionStatus = "confirmed" | "discussing" | "low";
export function discussionStatus(
  state: DemoState,
  planId: string,
  config = DEMO_CONFIG,
): DiscussionStatus {
  if (isCandidate(state, planId, config)) return "confirmed";
  return voteCount(state, planId, config) >=
    Math.ceil((config.pod.threshold + 1) / 2)
    ? "discussing"
    : "low";
}
export const DISCUSSION_LABELS: Record<DiscussionStatus, string> = {
  confirmed: "완료",
  discussing: "진행 중",
  low: "종료",
};
export function hasVoteChanges(state: DemoState, config = DEMO_CONFIG) {
  const previous = new Set(
    state.votes.filter((v) => v.memberId === config.currentMemberId).map((v) => v.planId),
  );
  const selected = new Set(state.selectedPlanIds);
  return previous.size !== selected.size || [...selected].some((id) => !previous.has(id));
}
export function proposerName(plan: InvestmentPlan, config = DEMO_CONFIG) {
  return plan.source === "member"
    ? (config.pod.members.find((m) => m.id === plan.proposedBy)?.name ??
        "모임원")
    : "AI";
}
export function canSubmit(state: DemoState) {
  return (
    (!state.submitted || DEMO_RULES.allowVoteChangesAfterSubmission) &&
    state.selectedPlanIds.length >= DEMO_RULES.minimumSelections
  );
}
export function canConfirm(state: DemoState, config = DEMO_CONFIG) {
  return (
    state.submitted &&
    !hasVoteChanges(state, config) &&
    !!currentMember(config)?.isRepresentative &&
    state.confirmationPlanIds.length > 0 &&
    state.confirmationPlanIds.every((id) => isCandidate(state, id, config))
  );
}
export function totalInvestmentAmount(state: DemoState) {
  return state.confirmationPlanIds.reduce(
    (total, id) => total + (state.investmentAmounts[id] ?? 0),
    0,
  );
}
export function canRequestInvestment(state: DemoState, config = DEMO_CONFIG) {
  return canConfirm(state, config) && state.confirmationPlanIds.every((id) => {
    const amount = state.investmentAmounts[id] ?? 0;
    return Number.isSafeInteger(amount) && amount > 0;
  }) && Number.isSafeInteger(totalInvestmentAmount(state));
}
export type Action =
  | { type: "toggleSelection"; planId: string }
  | { type: "submit" }
  | { type: "receiveVote"; vote: Vote }
  | { type: "setInvestmentAmount"; planId: string; amount: number }
  | { type: "toggleConfirmation"; planId: string };
export function reduceDemo(
  state: DemoState,
  action: Action,
  config = DEMO_CONFIG,
): DemoState {
  if (action.type === "setInvestmentAmount") {
    if (!canConfirm(state, config) || !state.confirmationPlanIds.includes(action.planId) ||
      !Number.isSafeInteger(action.amount) || action.amount < 0) return state;
    return { ...state, investmentAmounts: { ...state.investmentAmounts, [action.planId]: action.amount } };
  }
  if (action.type === "receiveVote") {
    const vote = action.vote;
    if (
      vote.memberId === config.currentMemberId ||
      !config.pod.members.some((m) => m.id === vote.memberId) ||
      !config.plans.some((p) => p.id === vote.planId) ||
      state.votes.some(
        (v) => v.memberId === vote.memberId && v.planId === vote.planId,
      )
    )
      return state;
    return {
      ...state,
      votes: [...state.votes, { ...vote }],
      latestVote: { ...vote },
    };
  }
  if (action.type === "toggleSelection") {
    if (
      (state.submitted && !DEMO_RULES.allowVoteChangesAfterSubmission) ||
      !config.plans.some((e) => e.id === action.planId)
    )
      return state;
    const selected = state.selectedPlanIds.includes(action.planId);
    if (
      !selected &&
      DEMO_RULES.maximumSelections !== null &&
      state.selectedPlanIds.length >= DEMO_RULES.maximumSelections
    )
      return state;
    return {
      ...state,
      selectedPlanIds: selected
        ? state.selectedPlanIds.filter((id) => id !== action.planId)
        : [...state.selectedPlanIds, action.planId],
    };
  }
  if (action.type === "submit") {
    if (!canSubmit(state) || !currentMember(config)) return state;
    if (state.submitted && !hasVoteChanges(state, config)) return state;
    const votes = state.votes.filter((v) => v.memberId !== config.currentMemberId);
    for (const id of new Set(state.selectedPlanIds)) {
      if (
        config.plans.some((e) => e.id === id) &&
        !votes.some(
          (v) => v.planId === id && v.memberId === config.currentMemberId,
        )
      ) {
        votes.push({ memberId: config.currentMemberId, planId: id });
      }
    }
    const next = { ...state, votes, submitted: true };
    return {
      ...next,
      confirmationPlanIds: state.confirmationPlanIds.filter((id) => isCandidate(next, id, config)),
    };
  }
  if (
    !state.submitted ||
    !currentMember(config)?.isRepresentative ||
    !isCandidate(state, action.planId, config)
  )
    return state;
  const selected = state.confirmationPlanIds.includes(action.planId);
  return {
    ...state,
    confirmationPlanIds: selected
      ? state.confirmationPlanIds.filter((id) => id !== action.planId)
      : DEMO_RULES.allowMultipleConfirmation
        ? [...state.confirmationPlanIds, action.planId]
        : [action.planId],
  };
}
