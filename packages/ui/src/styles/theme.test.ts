import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * 反转主题（[data-theme="inverse"]）靠亮、暗两块里各写一遍"相反主题的取值"
 * （--ef-x-*）。这是手抄的第二份，改了一边忘了另一边不会报错——所以在这里核对。
 */
// 测试在包的根目录下跑（jsdom 环境里 import.meta.url 不是文件地址，不能拿来定位）
const css = readFileSync(resolve("src/styles/theme.css"), "utf8");

/** 取出一条规则里的 --ef-* 声明。`selector` 是规则开头那一行里的一段 */
function block(selector: string): Map<string, string> {
  const start = css.indexOf(selector);
  expect(start, `找不到 ${selector}`).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  const body = css.slice(open, css.indexOf("\n}", open));
  const found = new Map<string, string>();
  for (const [, name, value] of body.matchAll(/--ef-([a-z-]+):\s*([^;]+);/g)) {
    found.set(name!, value!.trim());
  }
  return found;
}

const light = block(`[data-theme="light"] {`);
const dark = block(`[data-theme="dark"] {`);
/** 反转块的父元素：把底、字、强调色对调着抄一份 */
const parent = block(`:has(> [data-theme="inverse"])`);
const inverse = block(`\n[data-theme="inverse"] {`);

const isMirror = (name: string) => name.startsWith("x-");
const tokens = (theme: Map<string, string>) =>
  [...theme.keys()].filter((name) => !isMirror(name));
const mirrors = (theme: Map<string, string>) =>
  [...theme].filter(([name]) => isMirror(name) && name !== "x-scheme");

/** 这三对由父元素对调：反转块的底就是所在处的 surface-inverse，依此类推 */
const swapped = [
  ["surface", "surface-inverse"],
  ["ink", "ink-inverse"],
  ["accent-ink", "accent-ink-inverse"],
] as const;

describe("theme.css", () => {
  it("亮、暗两块定义的是同一组令牌", () => {
    expect([...light.keys()].sort()).toEqual([...dark.keys()].sort());
  });

  it("亮色块里的 --ef-x-* 和暗色块的取值逐项相同", () => {
    expect(mirrors(light).length).toBeGreaterThan(10);
    for (const [name, value] of mirrors(light)) {
      expect(value, name).toBe(dark.get(name.slice(2)));
    }
    expect(light.get("x-scheme")).toBe("dark");
  });

  it("暗色块里的 --ef-x-* 和亮色块的取值逐项相同", () => {
    for (const [name, value] of mirrors(dark)) {
      expect(value, name).toBe(light.get(name.slice(2)));
    }
    expect(dark.get("x-scheme")).toBe("light");
  });

  it("反转块的父元素把底、字、强调色对调着抄一份，而且只抄这三对", () => {
    const expected = swapped.flatMap(([token, counterpart]) => [
      [`x-${token}`, `var(--ef-${counterpart})`],
      [`x-${counterpart}`, `var(--ef-${token})`],
    ]);
    expect([...parent].sort()).toEqual(expected.sort());
  });

  it("父元素那条规则不落在反转块自己和它里面的元素上（否则变量成环）", () => {
    const rule = css.slice(
      css.indexOf(`:has(> [data-theme="inverse"])`),
      css.indexOf("{", css.indexOf(`:has(> [data-theme="inverse"])`)),
    );
    expect(rule.replace(/\s+/g, " ")).toContain(
      `:not( [data-theme="inverse"], [data-theme="inverse"] * )`,
    );
  });

  it("两个主题下取值不同的令牌，反转主题都重新指过", () => {
    const differing = tokens(light).filter(
      (name) => light.get(name) !== dark.get(name),
    );
    expect(differing.length).toBeGreaterThan(15);
    for (const name of differing) {
      expect(inverse.has(name), `反转主题漏了 --ef-${name}`).toBe(true);
    }
  });

  it("反转主题里的每一项都指向同名的 --ef-x-*，那个变量有人给", () => {
    expect(inverse.size).toBeGreaterThan(15);
    for (const [name, value] of inverse) {
      expect(value, name).toBe(`var(--ef-x-${name})`);
      const provided =
        parent.has(`x-${name}`) ||
        (light.has(`x-${name}`) && dark.has(`x-${name}`));
      expect(provided, `没有地方给 --ef-x-${name}`).toBe(true);
    }
  });
});
