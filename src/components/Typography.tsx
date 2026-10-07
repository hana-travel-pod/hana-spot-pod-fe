import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { colors, fonts } from "../theme";

export function AppText({ style, ...props }: TextProps) {
  const resolved = StyleSheet.flatten(style);
  const weight = Number(resolved?.fontWeight || 400);
  const fontFamily =
    weight >= 700 ? fonts.bold : weight >= 500 ? fonts.medium : fonts.regular;
  return (
    <Text
      {...props}
      style={[
        {
          fontSize: 16,
          color: colors.text,
          flexShrink: 1,
          // Leave room for Hana font ascenders/descenders on native iOS too.
          lineHeight: Math.ceil((resolved?.fontSize ?? 16) * 1.45),
        },
        style,
        { fontFamily, fontWeight: "normal" },
      ]}
    />
  );
}
