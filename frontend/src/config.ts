export type AppConfig = {
  apiUrl: string;
};

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (res.ok) {
      cachedConfig = (await res.json()) as AppConfig;
      return cachedConfig;
    }
  } catch {
    // Fall back to defaults below.
  }
  cachedConfig = {
    apiUrl: "/api/backend",
  };
  return cachedConfig;
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    return { apiUrl: "/api/backend" };
  }
  return cachedConfig;
}
