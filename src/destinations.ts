export type DestinationType = "country" | "city" | "airport";
export type DestinationSelection = {
  id: string;
  type: DestinationType;
  countryId?: string;
  cityId?: string;
  airportCode?: string;
};
export type Destination = DestinationSelection & {
  name: string;
  nameEn: string;
  aliases: string[];
  countryId: string;
  countryName: string;
  countryNameEn: string;
  category: string;
  region: string;
  cityId?: string;
  cityName?: string;
  cityNameEn?: string;
  airportCode?: string;
  servedCityIds?: string[];
};

const countries = [
  ["CN", "중국", "China", "중국", "동아시아", ["中国"]],
  ["JP", "일본", "Japan", "일본", "동아시아", ["日本"]],
  ["FR", "프랑스", "France", "유럽", "서유럽", []],
  ["KR", "대한민국", "South Korea", "국내", "동아시아", ["한국", "Korea"]],
  ["ID", "인도네시아", "Indonesia", "동남아", "동남아시아", []],
  ["US", "미국", "United States", "북미", "북아메리카", ["USA", "America"]],
] as const;
const countryEntries: Destination[] = countries.map(
  ([code, name, nameEn, category, region, aliases]) => ({
    id: `country:${code}`,
    type: "country",
    name,
    nameEn,
    aliases: [...aliases],
    countryId: `country:${code}`,
    countryName: name,
    countryNameEn: nameEn,
    category,
    region,
  }),
);
const cities = [
  [
    "CN-beijing",
    "베이징",
    "Beijing",
    "CN",
    "베이징시",
    ["북경", "北京", "Peking"],
  ],
  [
    "US-los-angeles",
    "로스앤젤레스",
    "Los Angeles",
    "US",
    "캘리포니아",
    ["LA", "엘에이", "로스엔젤레스"],
  ],
  ["JP-tokyo", "도쿄", "Tokyo", "JP", "도쿄도", ["동경", "東京"]],
  ["JP-osaka", "오사카", "Osaka", "JP", "오사카부", []],
  ["JP-kyoto", "교토", "Kyoto", "JP", "교토부", []],
  ["FR-paris", "파리", "Paris", "FR", "일드프랑스", []],
  ["KR-seoul", "서울", "Seoul", "KR", "수도권", []],
  ["KR-jeju", "제주", "Jeju", "KR", "제주특별자치도", ["제주도"]],
  ["KR-busan", "부산", "Busan", "KR", "부산광역시", ["Pusan"]],
  ["ID-bali", "발리", "Bali", "ID", "발리주", ["덴파사르", "Denpasar"]],
  ["US-paris-tx", "파리", "Paris", "US", "텍사스", ["Texas", "Paris Texas"]],
] as const;
const cityEntries: Destination[] = cities.map(
  ([code, name, nameEn, countryCode, region, aliases]) => {
    const country = countryEntries.find(
      (c) => c.id === `country:${countryCode}`,
    )!;
    return {
      ...country,
      id: `city:${code}`,
      type: "city",
      name,
      nameEn,
      region,
      aliases: [...aliases],
      cityId: `city:${code}`,
      cityName: name,
      cityNameEn: nameEn,
    };
  },
);
const airports = [
  [
    "PEK",
    "베이징 수도 국제공항",
    "Beijing Capital International Airport",
    "CN-beijing",
    ["수도공항", "Beijing Capital"],
    [],
  ],
  [
    "PKX",
    "베이징 다싱 국제공항",
    "Beijing Daxing International Airport",
    "CN-beijing",
    ["다싱", "Daxing"],
    [],
  ],
  [
    "LAX",
    "로스앤젤레스 국제공항",
    "Los Angeles International Airport",
    "US-los-angeles",
    ["LA 공항", "엘에이 공항"],
    [],
  ],
  [
    "NRT",
    "나리타 국제공항",
    "Narita International Airport",
    "JP-tokyo",
    ["Narita", "나리타"],
    [],
  ],
  [
    "HND",
    "하네다 공항",
    "Haneda Airport",
    "JP-tokyo",
    ["Tokyo International Airport", "하네다"],
    [],
  ],
  [
    "KIX",
    "간사이 국제공항",
    "Kansai International Airport",
    "JP-osaka",
    ["간사이", "Kansai"],
    ["city:JP-kyoto"],
  ],
  [
    "ITM",
    "이타미 공항",
    "Osaka International Airport",
    "JP-osaka",
    ["Itami", "이타미"],
    ["city:JP-kyoto"],
  ],
  [
    "CDG",
    "샤를 드골 공항",
    "Charles de Gaulle Airport",
    "FR-paris",
    ["샤를드골", "Roissy", "Paris CDG"],
    [],
  ],
  [
    "ORY",
    "오를리 공항",
    "Orly Airport",
    "FR-paris",
    ["오를리", "Paris Orly"],
    [],
  ],
  [
    "BVA",
    "파리 보베 공항",
    "Paris Beauvais Airport",
    "FR-paris",
    ["보베", "Beauvais"],
    [],
  ],
  [
    "ICN",
    "인천 국제공항",
    "Incheon International Airport",
    "KR-seoul",
    ["인천", "Incheon"],
    [],
  ],
  [
    "GMP",
    "김포 국제공항",
    "Gimpo International Airport",
    "KR-seoul",
    ["김포", "Gimpo"],
    [],
  ],
  [
    "CJU",
    "제주 국제공항",
    "Jeju International Airport",
    "KR-jeju",
    ["제주공항"],
    [],
  ],
  [
    "PUS",
    "김해 국제공항",
    "Gimhae International Airport",
    "KR-busan",
    ["김해", "Gimhae"],
    [],
  ],
  [
    "DPS",
    "응우라라이 국제공항",
    "Ngurah Rai International Airport",
    "ID-bali",
    ["발리공항", "덴파사르", "Denpasar"],
    [],
  ],
  [
    "PRX",
    "콕스 필드 공항",
    "Cox Field Airport",
    "US-paris-tx",
    ["Cox Field", "콕스필드"],
    [],
  ],
] as const;
const airportEntries: Destination[] = airports.map(
  ([code, name, nameEn, cityCode, aliases, servedCities]) => {
    const city = cityEntries.find((c) => c.id === `city:${cityCode}`)!;
    return {
      ...city,
      id: `airport:${code}`,
      type: "airport",
      name,
      nameEn,
      aliases: [...aliases],
      airportCode: code,
      servedCityIds: [city.id, ...servedCities],
    };
  },
);
export const destinations: readonly Destination[] = [
  ...countryEntries,
  ...cityEntries,
  ...airportEntries,
];
export const destinationTypes = {
  country: "국가",
  city: "도시",
  airport: "공항",
} as const;
export const findDestination = (id?: string) =>
  destinations.find((d) => d.id === id);
export const selectionForDestination = (
  d: Destination,
): DestinationSelection => ({
  id: d.id,
  type: d.type,
  countryId: d.countryId,
  ...(d.cityId ? { cityId: d.cityId } : {}),
  ...(d.airportCode ? { airportCode: d.airportCode } : {}),
});
export const normalizeDestinationQuery = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,·/()\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function destinationResultLabel(d: Destination) {
  if (d.type === "country") return d.name;
  if (d.type === "city")
    return `${d.name} / ${d.countryName} / ${d.region} / 모든 공항`;
  return `${d.name} (${d.airportCode}) / ${d.cityName}, ${d.countryName} / ${d.region}`;
}
export function destinationSearchText(d: Destination) {
  const servingCities = (d.servedCityIds || []).map((id) =>
    findDestination(id),
  );
  return [
    d.name,
    d.nameEn,
    ...d.aliases,
    d.airportCode,
    d.countryName,
    d.countryNameEn,
    d.cityName,
    d.cityNameEn,
    d.region,
    ...servingCities.flatMap((c) => (c ? [c.name, c.nameEn] : [])),
  ]
    .filter(Boolean)
    .join(" ");
}
export function searchDestinations(query: string): Destination[] {
  const normalized = normalizeDestinationQuery(query);
  if (!normalized) return [];
  const tokens = normalized.split(" ");
  return destinations
    .filter((d) =>
      tokens.every((token) =>
        normalizeDestinationQuery(destinationSearchText(d)).includes(token),
      ),
    )
    .sort((a, b) => {
      const exact = (d: Destination) =>
        [d.name, d.nameEn, d.airportCode || "", ...d.aliases].some(
          (v) => normalizeDestinationQuery(v) === normalized,
        )
          ? 0
          : 1;
      const typeRank = { country: 0, city: 1, airport: 2 };
      return exact(a) - exact(b) || typeRank[a.type] - typeRank[b.type];
    });
}
export async function lookupDestinations(
  query: string,
): Promise<Destination[]> {
  return searchDestinations(query);
}
export function destinationFields(selection?: DestinationSelection) {
  const d = findDestination(selection?.id);
  if (!d || d.type !== selection?.type)
    return {
      destinationSelection: undefined,
      country: "",
      destination: "",
      category: "미정",
    };
  return {
    destinationSelection: selectionForDestination(d),
    country: d.countryName,
    category: d.category,
    destination:
      d.type === "country"
        ? "전체"
        : d.type === "city"
          ? `${d.name} / 모든 공항`
          : `${d.cityName} / ${d.name} (${d.airportCode})`,
  };
}
export function destinationScopesOverlap(
  a: DestinationSelection,
  b: DestinationSelection,
) {
  const left = findDestination(a.id),
    right = findDestination(b.id);
  if (!left || !right || left.countryId !== right.countryId) return false;
  if (left.type === "country" || right.type === "country") return true;
  if (left.type === "airport" && right.type === "airport")
    return left.id === right.id;
  if (left.type === "city" && right.type === "city")
    return left.id === right.id;
  const city = left.type === "city" ? left : right;
  const airport = left.type === "airport" ? left : right;
  return airport.servedCityIds?.includes(city.id) || false;
}
export function inferLegacyDestination(pod: {
  country: string;
  destination: string;
}): DestinationSelection | undefined {
  const country = countryEntries.find((c) =>
    [c.name, c.nameEn, ...c.aliases].some(
      (name) =>
        normalizeDestinationQuery(name) ===
        normalizeDestinationQuery(pod.country),
    ),
  );
  if (!country) return undefined;
  const text = pod.destination.trim();
  if (!text || text === "전체") return selectionForDestination(country);
  const code = text.toUpperCase().match(/\b[A-Z]{3}\b/)?.[0];
  if (code) {
    const airport = airportEntries.find(
      (d) => d.airportCode === code && d.countryId === country.id,
    );
    return airport ? selectionForDestination(airport) : undefined;
  }
  const city = cityEntries.find(
    (d) =>
      d.countryId === country.id &&
      [d.name, d.nameEn, ...d.aliases].some(
        (name) =>
          normalizeDestinationQuery(name) === normalizeDestinationQuery(text),
      ),
  );
  return city ? selectionForDestination(city) : undefined;
}
export function normalizePodDestination<
  T extends {
    country: string;
    destination: string;
    destinationSelection?: DestinationSelection;
  },
>(pod: T): T {
  const candidate = findDestination(pod.destinationSelection?.id);
  const selection =
    candidate && candidate.type === pod.destinationSelection?.type
      ? selectionForDestination(candidate)
      : inferLegacyDestination(pod);
  return { ...pod, destinationSelection: selection };
}
export function podMatchesDestination(
  pod: {
    country: string;
    destination: string;
    destinationSelection?: DestinationSelection;
  },
  selection: DestinationSelection,
) {
  const normalized = normalizePodDestination(pod);
  if (normalized.destinationSelection)
    return destinationScopesOverlap(normalized.destinationSelection, selection);
  const d = findDestination(selection.id);
  // Unrecognized legacy city text is preserved, never guessed into an airport scope.
  return (
    !!d &&
    d.type === "country" &&
    normalizeDestinationQuery(pod.country) ===
      normalizeDestinationQuery(d.countryName)
  );
}
export function podMatchesSearch(
  pod: {
    title: string;
    country: string;
    destination: string;
    destinationSelection?: DestinationSelection;
  },
  query: string,
) {
  const normalized = normalizeDestinationQuery(query);
  if (!normalized) return true;
  const own = normalizeDestinationQuery(
    `${pod.title} ${pod.country} ${pod.destination}`,
  );
  if (own.includes(normalized)) return true;
  return searchDestinations(query).some((d) => podMatchesDestination(pod, d));
}
