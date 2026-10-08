import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

type Snapshot = { theme: ThemePreference; resolvedTheme: Theme };

const STORAGE_KEY = "ef-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const serverSnapshot: Snapshot = { theme: "light", resolvedTheme: "light" };
const listeners = new Set<() => void>();
let snapshot: Snapshot | null = null;
let stopWatchingSystem: (() => void) | null = null;

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function resolve(theme: ThemePreference): Theme {
  if (theme !== "system") return theme;
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

/** 取值顺序：上次保存的选择 → `<html data-theme>` 现有的值 → 亮色 */
function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isPreference(stored)) return stored;
  } catch {
    // 存储不可用（隐私模式等）时退回到下面的来源
  }
  const attribute = document.documentElement.dataset.theme;
  return attribute === "dark" ? "dark" : "light";
}

function getSnapshot(): Snapshot {
  if (!snapshot) {
    const theme = readPreference();
    snapshot = { theme, resolvedTheme: resolve(theme) };
  }
  return snapshot;
}

function commit(theme: ThemePreference) {
  snapshot = { theme, resolvedTheme: resolve(theme) };
  document.documentElement.dataset.theme = snapshot.resolvedTheme;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!stopWatchingSystem) {
    const media = window.matchMedia?.(DARK_QUERY);
    const onChange = () => {
      if (getSnapshot().theme === "system") commit("system");
    };
    media?.addEventListener("change", onChange);
    stopWatchingSystem = () => media?.removeEventListener("change", onChange);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopWatchingSystem?.();
      stopWatchingSystem = null;
    }
  };
}

function setTheme(theme: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 存不下来也照常切换，只是刷新后不保留
  }
  commit(theme);
}

/**
 * 读写 `<html data-theme>`。
 *
 * - `theme`：用户的选择，可以是 `"system"`；
 * - `resolvedTheme`：实际生效的 `"light"` 或 `"dark"`；
 * - `setTheme`：切换并记到 `localStorage`。
 */
export function useTheme(): Snapshot & {
  setTheme: (theme: ThemePreference) => void;
} {
  const { theme, resolvedTheme } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  return { theme, resolvedTheme, setTheme };
}
