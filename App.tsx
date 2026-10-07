import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { InvestmentApp } from "./src/InvestmentApp";

export default function App() {
  const [loaded, error] = useFonts({
    HanaRegular: require("./assets/fonts/Hana2-Regular.otf"),
    HanaMedium: require("./assets/fonts/Hana2-Medium.otf"),
    HanaBold: require("./assets/fonts/Hana2-Bold.otf"),
    HanaHeavy: require("./assets/fonts/Hana2-Heavy.otf"),
  });
  return (
    <SafeAreaProvider>
      {loaded || error ? (
        <InvestmentApp />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color="#008485" />
          <Text style={styles.label}>모임의 투자안을 준비하고 있어요</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F8F8",
    gap: 16,
  },
  label: { color: "#526664", fontSize: 15 },
});
