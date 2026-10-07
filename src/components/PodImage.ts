import { Image, Platform, type ImageSourcePropType } from "react-native";
import { normalizeDestinationImage } from "../data";

// Reuse the same bundled source in cards and details to share the image cache.
export const imageAssets = {
  logo: require("../../assets/images/optimized/logo.png"),
  airplane: require("../../assets/images/optimized/travel-airplane.png"),
  japan: require("../../assets/images/optimized/japan.jpg"),
  china: require("../../assets/images/optimized/china.jpg"),
  europe: require("../../assets/images/optimized/europe.jpg"),
  america: require("../../assets/images/optimized/los-angeles.jpg"),
  stable: require("../../assets/images/optimized/stable.png"),
  balanced: require("../../assets/images/optimized/balanced.png"),
  aggressive: require("../../assets/images/optimized/aggressive.png"),
  bali: require("../../assets/images/optimized/bali.jpg"),
  korea: require("../../assets/images/optimized/korea.jpg"),
};
const destinationSources: Record<string, ImageSourcePropType> = {
  "asset:japan": imageAssets.japan,
  "asset:china": imageAssets.china,
  "asset:europe": imageAssets.europe,
  "asset:los-angeles": imageAssets.america,
  "asset:bali": imageAssets.bali,
  "asset:korea": imageAssets.korea,
};
export function podImageSource(image: string): ImageSourcePropType {
  return (
    destinationSources[normalizeDestinationImage(image)] ?? {
      uri: image,
      cache: "force-cache",
    }
  );
}

let prefetchStarted = false;
// Warm likely next-screen images in the background; never block the first render.
export async function prefetchAppImages() {
  if (Platform.OS === "web" || prefetchStarted) return;
  prefetchStarted = true;
  const sources: ImageSourcePropType[] = Object.values(imageAssets);
  for (let index = 0; index < sources.length; index += 3) {
    await Promise.all(
      sources.slice(index, index + 3).map(async (source) => {
        try {
          const resolved = Image.resolveAssetSource(source);
          if (resolved?.uri) await Image.prefetch(resolved.uri);
        } catch {
          // The normal Image request retries if a development asset server is unavailable.
        }
      }),
    );
  }
}
