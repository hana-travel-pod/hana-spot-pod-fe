import {
  type DestinationSelection,
  destinationFields,
  findDestination,
  podMatchesDestination,
  podMatchesSearch,
} from "./destinations.ts";

export type Investment = "없음" | "안정" | "균형" | "공격";
export type Gender = "제한 없음" | "여성" | "남성";
export type Age = "제한 없음" | "20대" | "30대" | "40대" | "50대 이상";
export type Pod = {
  id: string;
  title: string;
  country: string;
  destination: string;
  destinationSelection?: DestinationSelection;
  category: string;
  startDate: string;
  endDate: string;
  budget: number;
  capacity: number;
  members: number;
  gender: Gender;
  age: Age;
  verified: boolean;
  investment: Investment;
  description: string;
  approval: number;
  deposit: number;
  host: string;
  image: string;
};
export type Application = {
  podId: string;
  message: string;
  createdAt: string;
  status: "pending" | "approved";
};
export type Profile = {
  name: string;
  gender: Exclude<Gender, "제한 없음">;
  age: Exclude<Age, "제한 없음">;
  verified: boolean;
};
export type Filters = {
  destinationId: string;
  investment: "전체" | Investment;
  budget: string;
  gender: "전체" | Gender;
  age: "전체" | Age;
  verifiedOnly: boolean;
  startDate: string;
  endDate: string;
};
export const emptyFilters: Filters = {
  destinationId: "",
  investment: "전체",
  budget: "",
  gender: "전체",
  age: "전체",
  verifiedOnly: false,
  startDate: "",
  endDate: "",
};
export const defaultProfile: Profile = {
  name: "김하나",
  gender: "여성",
  age: "20대",
  verified: true,
};
export const money = (value: number) => value.toLocaleString("ko-KR");
export const dateLabel = (value: string) => value.slice(5).replace("-", ".");
export const destinationLabel = (pod: Pick<Pod, "country" | "destination">) =>
  [pod.country, pod.destination].filter(Boolean).join(" / ") || "목적지 미정";
export const travelDateLabel = (pod: Pick<Pod, "startDate" | "endDate">) =>
  !pod.startDate && !pod.endDate
    ? "여행 일정 미정"
    : `${pod.startDate || "미정"} ~ ${pod.endDate || "미정"}`;
export const budgetLabel = (budget: number) =>
  budget > 0 ? `${money(budget)}원` : "미정";

export type PodDraft = {
  title: string;
  country: string;
  destination: string;
  destinationSelection?: DestinationSelection;
  category: string;
  startDate: string;
  endDate: string;
  capacity: string;
  budget: string;
  deposit: string;
  approval: string;
  gender: Gender;
  age: Age;
  verified: boolean;
  investment: Investment;
  description: string;
};
export const emptyPodDraft: PodDraft = {
  title: "",
  country: "",
  destination: "",
  category: "미정",
  startDate: "",
  endDate: "",
  capacity: "",
  budget: "",
  deposit: "",
  approval: "",
  gender: "제한 없음",
  age: "제한 없음",
  verified: false,
  investment: "없음",
  description: "",
};
// Blank dates/destination and a zero budget represent information to be agreed later.
// Operational values still get explicit defaults so membership and voting work.
export function buildPod(draft: PodDraft, id: string, image: string): Pod {
  const capacity = draft.capacity.trim() ? Number(draft.capacity) : 4;
  return {
    ...draft,
    ...(draft.destinationSelection
      ? destinationFields(draft.destinationSelection)
      : {}),
    id,
    image,
    host: "나",
    members: 1,
    title: draft.title.trim() || "함께 떠나는 여행",
    country: draft.destinationSelection
      ? destinationFields(draft.destinationSelection).country
      : draft.country.trim(),
    destination: draft.destinationSelection
      ? destinationFields(draft.destinationSelection).destination
      : draft.destination.trim(),
    description: draft.description.trim(),
    capacity,
    budget: draft.budget.trim() ? Number(draft.budget) : 0,
    deposit: draft.deposit.trim() ? Number(draft.deposit) : 0,
    approval: draft.approval.trim()
      ? Number(draft.approval)
      : Math.floor(capacity / 2) + 1,
  };
}

export function clampApproval(value: number, capacity: number) {
  const maximum = Number.isInteger(capacity) && capacity >= 1 ? capacity : 4;
  return Math.max(
    1,
    Math.min(
      maximum,
      Math.round(Number.isFinite(value) ? value : Math.floor(maximum / 2) + 1),
    ),
  );
}

export function calendarDays(month: string): (string | null)[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const count = new Date(year, monthNumber, 0).getDate();
  return Array.from(
    { length: Math.ceil((first.getDay() + count) / 7) * 7 },
    (_, i) => {
      const day = i - first.getDay() + 1;
      return day < 1 || day > count
        ? null
        : `${month}-${String(day).padStart(2, "0")}`;
    },
  );
}
export function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const next = new Date(year, monthNumber - 1 + offset, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export type DateRange = { startDate: string; endDate: string };

export function selectRangeDate(range: DateRange, date: string): DateRange {
  if (!validDate(date)) return range;
  if (!range.startDate || range.endDate || date < range.startDate) {
    return { startDate: date, endDate: "" };
  }
  return { startDate: range.startDate, endDate: date };
}

export function tripDuration(range: DateRange): string | null {
  if (
    !validDate(range.startDate) ||
    !validDate(range.endDate) ||
    range.endDate < range.startDate
  )
    return null;
  // UTC date-only arithmetic keeps nights correct across daylight-saving changes.
  const nights =
    (Date.parse(range.endDate + "T00:00:00Z") -
      Date.parse(range.startDate + "T00:00:00Z")) /
    86400000;
  return `${nights}박 ${nights + 1}일`;
}
export function eligibility(pod: Pod, profile: Profile): string | null {
  if (pod.members >= pod.capacity) return "모집 인원이 모두 찼어요.";
  if (
    (pod.startDate || pod.endDate) &&
    (pod.startDate || pod.endDate) < today()
  )
    return "모집이 종료된 여행이에요.";
  if (pod.gender !== "제한 없음" && pod.gender !== profile.gender)
    return "팟의 성별 참여 조건과 맞지 않아요.";
  if (pod.age !== "제한 없음" && pod.age !== profile.age)
    return "팟의 연령대 참여 조건과 맞지 않아요.";
  if (pod.verified && !profile.verified)
    return "본인인증이 필요한 팟이에요. 내 정보에서 데모 인증을 진행해주세요.";
  return null;
}
export function matches(
  pod: Pod,
  search: string,
  category: string,
  filters: Filters,
) {
  return (
    (!(pod.startDate || pod.endDate) ||
      (pod.startDate || pod.endDate) >= today()) &&
    pod.members < pod.capacity &&
    (category === "전체" || pod.category === category) &&
    podMatchesSearch(pod, search) &&
    (!filters.destinationId ||
      (!!findDestination(filters.destinationId) &&
        podMatchesDestination(pod, findDestination(filters.destinationId)!))) &&
    (filters.investment === "전체" || pod.investment === filters.investment) &&
    (!filters.budget ||
      (pod.budget > 0 && pod.budget <= Number(filters.budget))) &&
    (filters.gender === "전체" ||
      pod.gender === "제한 없음" ||
      pod.gender === filters.gender) &&
    (filters.age === "전체" ||
      pod.age === "제한 없음" ||
      pod.age === filters.age) &&
    (!filters.verifiedOnly || pod.verified) &&
    (!filters.startDate ||
      (!!pod.startDate && pod.startDate >= filters.startDate)) &&
    (!filters.endDate || (!!pod.endDate && pod.endDate <= filters.endDate))
  );
}
export function validatePod(pod: Pod): string | null {
  if (
    (pod.startDate && !validDate(pod.startDate)) ||
    (pod.endDate && !validDate(pod.endDate))
  )
    return "올바른 여행 날짜를 선택해주세요.";
  if (
    (pod.startDate && pod.startDate < today()) ||
    (pod.endDate && pod.endDate < today())
  )
    return "여행일은 오늘 이후로 선택해주세요.";
  if (pod.startDate && pod.endDate && pod.endDate < pod.startDate)
    return "종료일은 시작일 이후로 설정해주세요.";
  if (!Number.isInteger(pod.capacity) || pod.capacity < 2 || pod.capacity > 20)
    return "모집 인원은 개설자 포함 2~20명으로 설정해주세요.";
  if (!Number.isInteger(pod.budget) || pod.budget < 0 || pod.budget > 100000000)
    return "기본 경비는 0원~1억원 사이로 입력해주세요. 0원은 미정으로 표시해요.";
  if (
    !Number.isInteger(pod.deposit) ||
    pod.deposit < 0 ||
    (pod.budget > 0 && pod.deposit > pod.budget)
  )
    return "예치금은 0원 이상으로, 기본 경비가 정해졌다면 그 이하로 설정해주세요.";
  if (
    !Number.isInteger(pod.approval) ||
    pod.approval < 1 ||
    pod.approval > pod.capacity
  )
    return "승인 인원은 1명~모집 인원 사이로 설정해주세요.";
  return null;
}

export function confirmJoin(
  pods: Pod[],
  applications: Application[],
  podId: string,
  profile: Profile,
  message = "",
) {
  const pod = pods.find((p) => p.id === podId);
  if (!pod) throw new Error("팟을 찾을 수 없어요.");
  if (pod.host === "나")
    throw new Error("내가 만든 팟에는 이미 참여하고 있어요.");
  if (applications.some((a) => a.podId === podId))
    throw new Error("이미 참가한 팟이에요.");
  const issue = eligibility(pod, profile);
  if (issue) throw new Error(issue);
  return {
    pods: pods.map((p) =>
      p.id === podId ? { ...p, members: p.members + 1 } : p,
    ),
    applications: [
      ...applications,
      {
        podId,
        message: message.trim(),
        createdAt: new Date().toISOString(),
        status: "approved" as const,
      },
    ],
  };
}
// Upgrade previously saved pending requests once, without exceeding capacity.
export function approvePendingApplications(
  pods: Pod[],
  applications: Application[],
  profile: Profile,
) {
  let nextPods = pods;
  const nextApplications = applications.map((a) => {
    if (a.status !== "pending") return a;
    const pod = nextPods.find((p) => p.id === a.podId);
    if (!pod || pod.host === "나" || eligibility(pod, profile)) return a;
    nextPods = nextPods.map((p) =>
      p.id === a.podId ? { ...p, members: p.members + 1 } : p,
    );
    return { ...a, status: "approved" as const };
  });
  return { pods: nextPods, applications: nextApplications };
}
