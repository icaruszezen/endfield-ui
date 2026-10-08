import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** useTheme 的状态存在模块作用域里，每个用例重新加载模块以免互相影响 */
async function loadUseTheme() {
  vi.resetModules();
  return (await import("./useTheme")).useTheme;
}

function mockSystemTheme(dark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    mockSystemTheme(false);
  });

  it("没有任何记录时是亮色，并写到 <html>", async () => {
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("沿用 <html> 上已有的 data-theme", async () => {
    document.documentElement.dataset.theme = "dark";
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("setTheme 切换、写属性并保存", async () => {
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("ef-theme")).toBe("dark");
  });

  it("保存过的选择优先于 <html> 上的属性", async () => {
    window.localStorage.setItem("ef-theme", "dark");
    document.documentElement.dataset.theme = "light";
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("system 跟随系统设置", async () => {
    mockSystemTheme(true);
    const useTheme = await loadUseTheme();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("system"));
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("多个使用方共享同一份状态", async () => {
    const useTheme = await loadUseTheme();
    const first = renderHook(() => useTheme());
    const second = renderHook(() => useTheme());

    act(() => first.result.current.setTheme("dark"));
    expect(second.result.current.resolvedTheme).toBe("dark");
  });
});
