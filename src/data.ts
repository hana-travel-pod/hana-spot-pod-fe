import { Pod } from "./domain";
export const destinationImages = {
  japan:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=85",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop&q=85",
  europe:
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1000&auto=format&fit=crop&q=85",
  korea:
    "https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=1000&auto=format&fit=crop&q=85",
};
export const categories = ["전체", "일본", "동남아", "유럽", "국내"];
export function makeSeeds(): Pod[] {
  const year = new Date().getFullYear() + 1;
  const base = {
    gender: "제한 없음" as const,
    age: "제한 없음" as const,
    verified: true,
    approval: 3,
    host: "여행하는 하나",
    deposit: 50000,
  };
  return [
    {
      ...base,
      id: "kyoto",
      title: "느긋하게, 교토 한 바퀴",
      country: "일본",
      destination: "교토 · KIX",
      category: "일본",
      startDate: `${year}-04-12`,
      endDate: `${year}-04-16`,
      budget: 850000,
      capacity: 6,
      members: 3,
      investment: "안정",
      image: destinationImages.japan,
      description:
        "벚꽃이 피는 교토에서 우리만의 속도로 걸어요.\n\n낮에는 작은 골목과 오래된 찻집을 찾아다니고, 저녁에는 함께 맛있는 밥을 먹으려고 해요. 하루에 한두 곳만 정하고 자유 시간도 넉넉히 가질 예정이에요.\n\n항공과 숙소는 팟이 모인 뒤 함께 비교하고 투표로 결정해요. 서로의 취향을 존중하는 분이라면 환영해요!",
      age: "20대",
    },
    {
      ...base,
      id: "bali",
      title: "발리에서 쉬어가는 일주일",
      country: "인도네시아",
      destination: "발리 · DPS",
      category: "동남아",
      startDate: `${year}-05-03`,
      endDate: `${year}-05-09`,
      budget: 1200000,
      capacity: 4,
      members: 2,
      investment: "없음",
      image: destinationImages.bali,
      description:
        "우붓의 초록과 스미냑의 노을을 함께 만나요. 요가, 카페, 바다 산책 위주로 여유롭게 보내는 휴식 여행이에요. 함께하는 일정과 각자의 자유 시간을 반반씩 계획합니다.",
      gender: "여성",
      approval: 3,
    },
    {
      ...base,
      id: "paris",
      title: "파리의 일상에 스며들기",
      country: "프랑스",
      destination: "파리 · CDG",
      category: "유럽",
      startDate: `${year}-06-10`,
      endDate: `${year}-06-17`,
      budget: 2400000,
      capacity: 6,
      members: 4,
      investment: "균형",
      image: destinationImages.europe,
      description:
        "미술관과 동네 빵집을 좋아하는 사람들의 파리 여행. 오전에는 전시를 보고, 오후에는 센 강을 걸어요. 공동 일정은 과반수 투표로 정하고 개인 일정은 자유롭게 즐겨요.",
      approval: 4,
    },
    {
      ...base,
      id: "jeju",
      title: "제주, 숲과 바다 사이",
      country: "대한민국",
      destination: "제주 · CJU",
      category: "국내",
      startDate: `${year}-03-20`,
      endDate: `${year}-03-23`,
      budget: 450000,
      capacity: 4,
      members: 1,
      investment: "없음",
      image: destinationImages.korea,
      description:
        "오름을 걷고 바다를 보며 가볍게 쉬어가는 3박 4일. 운전과 공용 경비는 공평하게 나누고, 매일 저녁 다음 날의 일정을 함께 결정해요.",
      verified: false,
      deposit: 30000,
    },
    {
      ...base,
      id: "osaka",
      title: "오사카 맛집 탐험대",
      country: "일본",
      destination: "오사카 · KIX",
      category: "일본",
      startDate: `${year}-04-22`,
      endDate: `${year}-04-25`,
      budget: 700000,
      capacity: 5,
      members: 2,
      investment: "공격",
      image: destinationImages.japan,
      description:
        "도톤보리부터 작은 동네 맛집까지, 먹는 데 진심인 분들과 함께해요. 식비는 각자 부담하고 숙소와 이동 계획은 함께 투표로 정합니다.",
      age: "30대",
    },
  ];
}
