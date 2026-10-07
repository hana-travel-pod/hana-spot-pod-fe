export const DEMO_STORAGE_PREFIX = "hana-spot-pod:";
export type DemoStorage = {
  getAllKeys: () => Promise<readonly string[]>;
  multiRemove: (keys: string[]) => Promise<void>;
};

/** Clear only this service's persisted demo data, including the join demo. */
export async function clearDemoStorage(storage: DemoStorage) {
  const keys = (await storage.getAllKeys()).filter((key) =>
    key.startsWith(DEMO_STORAGE_PREFIX),
  );
  if (keys.length > 0) await storage.multiRemove(keys);
}
