import React from "react";
import { Image, View } from "react-native";
import { Investment } from "../domain";
import { colors, styles as s } from "../theme";
import { AppText as Text } from "./Typography";

import { imageAssets } from "./PodImage";

type InvestmentStyle = Exclude<Investment, "없음">;
const descriptions = {
  안정: {
    image: imageAssets.stable,
    title: "차분하게, 안정성을 먼저",
    body: "큰 변동보다 안정적인 운용을 선호하는 분께 어울려요. 수익을 서두르기보다 위험을 낮추는 방향을 중시해요.",
  },
  균형: {
    image: imageAssets.balanced,
    title: "안정성과 성장 사이의 균형",
    body: "위험과 수익의 균형을 찾고 싶은 분께 어울려요. 일정 수준의 변동을 받아들이며 다양한 투자 방향을 함께 살펴봐요.",
  },
  공격: {
    image: imageAssets.aggressive,
    title: "변동을 감수하며 성장 추구",
    body: "높은 성장 가능성을 중시하는 분께 어울려요. 큰 가격 변동과 손실 위험을 감수하며 적극적인 투자 방향을 선호해요.",
  },
} as const;

export function InvestmentCard({
  investment,
}: {
  investment: InvestmentStyle;
}) {
  const description = descriptions[investment];
  return (
    <View style={[s.recommendation, { marginTop: 14 }]}>
      <View style={[s.between, { gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.muted, { color: colors.green, marginBottom: 8 }]}>
            함께 맞출 투자 성향
          </Text>
          <Text style={[s.heading, { color: colors.green }]}>{investment}</Text>
        </View>
        <Image
          source={description.image}
          fadeDuration={0}
          accessibilityLabel={`${investment} 투자 성향 아이콘`}
          resizeMode="contain"
          style={{ width: 112, height: 112 }}
        />
      </View>
      <Text style={[s.label, { marginTop: 16 }]}>{description.title}</Text>
      <Text style={s.muted}>{description.body}</Text>
    </View>
  );
}
