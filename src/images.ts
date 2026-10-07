import { Image, type ImageSourcePropType } from "react-native";

// Only these screen-sized assets are bundled; keep large originals for editing.
export const images = {
  mascot: require("../assets/images/optimized/mascot.png"),
  samsung: require("../assets/images/optimized/samsung.png"),
  skhynix: require("../assets/images/optimized/skhynix.png"),
  naver: require("../assets/images/optimized/naver.png"),
  hyundai: require("../assets/images/optimized/hyundai.png"),
  requestMascot: require("../assets/images/optimized/request-mascot.png"),
  successMascot: require("../assets/images/optimized/mascot-success.jpg"),
};

let preloadStarted = false;
// Start alongside font loading, prioritizing images visible on the first screen.
export async function preloadImages() {
  if (preloadStarted) return;
  preloadStarted = true;
  const sources: ImageSourcePropType[] = Object.values(images);
  for (let index = 0; index < sources.length; index += 3) {
    await Promise.all(sources.slice(index, index + 3).map(async (source) => {
      try {
        const resolved = typeof Image.resolveAssetSource === "function"
          ? Image.resolveAssetSource(source)
          : typeof source === "object" && !Array.isArray(source) ? source : null;
        if (resolved?.uri) await Image.prefetch(resolved.uri);
      } catch {
        // Normal Image loading still works if the development server is unavailable.
      }
    }));
  }
}
