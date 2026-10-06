export const COLORS = {
  // 주요 색상
  primary: '#008F87',        // 주요 청록
  primaryBright: '#18B7A7',  // 강조 민트
  primaryLight: '#EAF8F5',   // 연한 민트 배경
  primaryMid: '#B2E8E2',     // 중간 민트 (테두리·구분선용)
  primaryDark: '#005F5A',    // 짙은 청록 (제목)

  // 배경·표면
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F4FBFA',     // 카드 내부 서브 영역

  // 테두리
  border: '#E5EFED',

  // 글자
  text: '#172B2A',           // 본문
  textSecondary: '#72817F',  // 보조
  textHint: '#A8B5B2',       // 힌트·플레이스홀더

  // 상태
  success: '#008F87',
  successBg: '#EAF8F5',
  danger: '#D94040',
  dangerBg: '#FFF3F3',
  dangerBorder: '#F5C0C0',

  white: '#FFFFFF',
} as const;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 22,
  full: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 20,
  lg: 28,
  xl: 36,
} as const;

export const SHADOW = {
  card: {
    shadowColor: '#003B33',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
