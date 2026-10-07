import { normalizePodDestination } from "./destinations.ts";
import type { Pod, Application } from "./domain.ts";
export const DEMO_REVISION = 2;
export const destinationImages = {
  japan: "asset:japan",
  bali: "asset:bali",
  europe: "asset:europe",
  korea: "asset:korea",
  china: "asset:china",
  america: "asset:los-angeles",
};
// Resolve saved demo photos without resetting joins, saved pods or custom images.
const legacyPhotoIds: Record<string, string> = {
  "photo-1493976040374-85c8e12f0c0e": destinationImages.japan,
  "photo-1537996194471-e657df975ab4": destinationImages.bali,
  "photo-1499856871958-5b9627545d1a": destinationImages.europe,
  "photo-1534274867514-d5b47ef89ed7": destinationImages.korea,
  "photo-1508804185872-d7badad00f7d": destinationImages.china,
};
export function normalizeDestinationImage(image: string): string {
  const photoId =
    /^https:\/\/images\.unsplash\.com\/(photo-[\w-]+)(?:\?|$)/.exec(image)?.[1];
  return photoId ? (legacyPhotoIds[photoId] ?? image) : image;
}
export const categories = [
  "전체",
  "일본",
  "중국",
  "유럽",
  "북미",
  "동남아",
  "국내",
];
export function makeSeeds(): Pod[] {
  const base = {
    gender: "제한 없음" as const,
    age: "제한 없음" as const,
    verified: true,
    approval: 3,
    host: "여행하는 하나",
    deposit: 50000,
  };
  const seeds: Pod[] = [
    {
      ...base,
      id: "osaka",
      title: "오사카 맛집 탐험대",
      country: "일본",
      destination: "오사카 / KIX",
      category: "일본",
      startDate: "2026-11-06",
      endDate: "2026-11-09",
      budget: 700000,
      capacity: 5,
      members: 2,
      investment: "안정",
      image: destinationImages.japan,
      description:
        "먹는 즐거움과 골목 산책을 함께해요.\n\n1일차 / 도톤보리 산책과 타코야키 맛집\n2일차 / 오사카성, 우메다 전망대\n3일차 / 유니버설 스튜디오 또는 자유 일정\n4일차 / 구로몬 시장에서 아침 식사 후 귀국\n\n숙소와 이동 계획은 함께 투표로 정해요.",
    },
    {
      ...base,
      id: "beijing",
      title: "베이징, 역사 속으로 함께",
      country: "중국",
      destination: "베이징 / PEK",
      category: "중국",
      startDate: "2026-11-12",
      endDate: "2026-11-16",
      budget: 950000,
      capacity: 4,
      members: 2,
      investment: "균형",
      image: destinationImages.china,
      description:
        "오래된 궁궐과 활기찬 거리를 천천히 둘러봐요.\n\n1일차 / 왕푸징 거리와 저녁 식사\n2일차 / 자금성, 경산공원\n3일차 / 만리장성\n4일차 / 이화원, 후퉁 산책\n5일차 / 기념품 쇼핑 후 귀국\n\n입장권과 교통편은 함께 비교해 정해요.",
    },
    {
      ...base,
      id: "paris",
      title: "우리의 프랑스 4박 5일",
      country: "프랑스",
      destination: "파리 / CDG",
      category: "유럽",
      startDate: "2026-11-20",
      endDate: "2026-11-24",
      budget: 2400000,
      capacity: 4,
      members: 3,
      investment: "공격",
      image: destinationImages.europe,
      description:
        "파리에서 함께 보낼 4박 5일, 마지막 한 분을 기다려요!\n\n1일차 (11/20) / 파리 도착, 에펠탑과 센강 야경\n2일차 (11/21) / 루브르 박물관, 튈르리 정원\n3일차 (11/22) / 몽마르트르, 사크레쾨르 성당\n4일차 (11/23) / 베르사유 궁전, 파리 카페 산책\n5일차 (11/24) / 동네 빵집에서 아침 식사 후 귀국\n\n함께하는 일정과 자유 시간을 균형 있게 나눠요. 세부 일정과 공동 경비는 함께 투표로 정합니다.",
    },
    {
      ...base,
      id: "la",
      title: "LA의 햇살을 따라",
      country: "미국",
      destination: "로스앤젤레스 / LAX",
      category: "북미",
      startDate: "2026-12-02",
      endDate: "2026-12-07",
      budget: 2800000,
      capacity: 4,
      members: 2,
      investment: "없음",
      image: destinationImages.america,
      description:
        "영화 속 풍경과 해변의 노을을 함께 만나요.\n\n1일차 / LA 도착, 다운타운 산책\n2일차 / 할리우드, 그리피스 천문대\n3일차 / 유니버설 스튜디오\n4일차 / 산타모니카, 베니스 비치\n5일차 / 게티 센터와 자유 일정\n6일차 / 아침 식사 후 귀국\n\n렌터카와 숙소는 모인 뒤 함께 정해요.",
    },
  ];
  return seeds.map(normalizePodDestination);
}
// Replace the previous demo once; subsequent user-created pods and joins persist.
export function refreshDemoData<
  T extends {
    demoRevision?: number;
    pods: Pod[];
    applications: Application[];
    saved: string[];
  },
>(store: T): T & { demoRevision: number } {
  if (store.demoRevision === DEMO_REVISION)
    return {
      ...store,
      demoRevision: DEMO_REVISION,
      pods: store.pods.map((pod) =>
        pod.country === "미국"
          ? { ...pod, image: destinationImages.america }
          : { ...pod, image: normalizeDestinationImage(pod.image) },
      ),
    };
  return {
    ...store,
    demoRevision: DEMO_REVISION,
    pods: makeSeeds(),
    applications: [],
    saved: [],
  };
}
