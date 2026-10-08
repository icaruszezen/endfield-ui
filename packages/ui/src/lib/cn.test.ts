import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("后写的同类工具类覆盖先写的", () => {
    expect(cn("px-4", "px-9")).toBe("px-9");
    expect(cn("bg-control", "bg-action")).toBe("bg-action");
  });

  it("自定义字阶不会被当成颜色，与文字色共存", () => {
    expect(cn("text-micro", "text-ink")).toBe("text-micro text-ink");
    expect(cn("text-ink", "text-ghost")).toBe("text-ink text-ghost");
  });

  it("自定义字阶之间互相覆盖", () => {
    expect(cn("text-micro", "text-sm")).toBe("text-sm");
  });

  it("自定义阴影、缓动、动画各自归类", () => {
    expect(cn("shadow-xs", "shadow-rail")).toBe("shadow-rail");
    expect(cn("ease-standard", "ease-exit")).toBe("ease-exit");
    expect(cn("animate-spin", "animate-fade-in")).toBe("animate-fade-in");
  });

  it("忽略假值", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
