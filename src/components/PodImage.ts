import type { ImageSourcePropType } from "react-native";

// Keep the stored image reference serializable while bundling local photos offline.
export function podImageSource(image: string): ImageSourcePropType {
  return image === "asset:los-angeles"
    ? require("../../assets/images/los-angeles.png")
    : { uri: image };
}
