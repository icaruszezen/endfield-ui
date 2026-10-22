import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import * as main from "../index";
import * as core from "./lib/core";

/*
 * Game 实机风格是独立入口，带着官方图片。它和主库之间的那道墙靠约定是守不住的
 * （多写一行 import 就破了），所以在这里核对：
 *   - 主库不引这个目录里的任何东西；
 *   - 这个目录用主库的东西只经 lib/core.ts，并且只用主入口公开导出的名字；
 *   - 它的样式引了也动不到主库的控件：规则只以 `.ef-` 类起头，变量只叫 `--ef-game-*`。
 */
// 测试在包的根目录下跑（jsdom 环境里 import.meta.url 不是文件地址，不能拿来定位）
const src = resolve("src");
const game = join(src, "game");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const inGame = (file: string) => file.startsWith(game + sep);
const show = (file: string) => relative(src, file).split(sep).join("/");
const all = walk(src);
const code = all.filter((file) => /\.tsx?$/.test(file));
const isTest = (file: string) => /\.test\.tsx?$/.test(file);

/** 文件里写的相对引用（import / export … from、import()） */
function relativeImports(file: string) {
  const text = readFileSync(file, "utf8");
  return [
    ...text.matchAll(/\bfrom\s+["'](\.[^"']*)["']/g),
    ...text.matchAll(/\bimport\(\s*["'](\.[^"']*)["']\s*\)/g),
    ...text.matchAll(/^import\s+["'](\.[^"']*)["']/gm),
  ].map((match) => resolve(dirname(file), match[1]!));
}

describe("主库和 Game 实机风格之间只有一个方向", () => {
  it("主库的代码不引 game 目录里的东西", () => {
    const offenders = code
      .filter((file) => !inGame(file))
      .filter((file) =>
        relativeImports(file).some(
          (target) => target === game || inGame(target),
        ),
      )
      .map(show);
    expect(offenders).toEqual([]);
  });

  it("主库的样式不引 game 的样式，主样式入口不扫 game 目录", () => {
    const styles = all.filter((file) => file.endsWith(".css") && !inGame(file));
    const offenders = styles
      .filter((file) =>
        /@import\s+["'][^"']*\bgame\b/.test(readFileSync(file, "utf8")),
      )
      .map(show);
    expect(offenders).toEqual([]);
    expect(readFileSync(join(src, "styles/index.css"), "utf8")).toContain(
      '@source not "../game";',
    );
  });

  it("game 用主库的东西只经 lib/core.ts 一处", () => {
    const bridge = join(game, "lib", "core.ts");
    const offenders = code
      .filter((file) => inGame(file) && !isTest(file) && file !== bridge)
      .filter((file) => relativeImports(file).some((target) => !inGame(target)))
      .map(show);
    expect(offenders).toEqual([]);
  });

  it("lib/core.ts 里的都是主入口公开导出的名字", () => {
    for (const [name, value] of Object.entries(core)) {
      expect(main, `主入口没有导出 ${name}`).toHaveProperty(name);
      expect((main as Record<string, unknown>)[name], name).toBe(value);
    }
  });
});

type Rule = { selectors: string[]; body: string; file: string };

/** 去掉注释，把样式表拆成规则；@media 这类条件块往里走一层，@keyframes 只记名字 */
function parse(file: string) {
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: Rule[] = [];
  const keyframes: string[] = [];
  const statements: string[] = [];

  function read(text: string) {
    let at = 0;
    while (at < text.length) {
      const open = text.indexOf("{", at);
      const semi = text.indexOf(";", at);
      if (open < 0 || (semi >= 0 && semi < open)) {
        // 没有花括号的语句（@import、@layer a, b;）
        const end = semi < 0 ? text.length : semi;
        const statement = text.slice(at, end).trim();
        if (statement) statements.push(statement);
        at = end + 1;
        continue;
      }
      let depth = 1;
      let close = open + 1;
      while (close < text.length && depth > 0) {
        if (text[close] === "{") depth += 1;
        else if (text[close] === "}") depth -= 1;
        close += 1;
      }
      const prelude = text.slice(at, open).trim();
      const body = text.slice(open + 1, close - 1);
      if (/^@keyframes\s/.test(prelude)) {
        keyframes.push(prelude.replace(/^@keyframes\s+/, ""));
      } else if (/^@(media|container|supports)\b/.test(prelude)) {
        read(body);
      } else if (prelude.startsWith("@")) {
        throw new Error(`${show(file)}：没料到的规则 ${prelude}`);
      } else {
        rules.push({ selectors: splitSelectors(prelude), body, file });
      }
      at = close;
    }
  }
  read(css);
  return { rules, keyframes, statements };
}

/** 按逗号拆选择器，括号里的逗号不算（`:is(a, b)`） */
function splitSelectors(prelude: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of prelude) {
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.replace(/\s+/g, " ").trim());
}

const customProperties = (body: string) =>
  [...body.matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g)].map((match) => match[1]!);
const declarations = (body: string) =>
  body
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(0, line.indexOf(":")).trim());

/** 主题范围：亮暗两套图要"最近的主题说了算"，只能把变量挂在这几处、靠继承取 */
const THEME_SCOPES = new Set([
  ":root",
  '[data-theme="light"]',
  '[data-theme="dark"]',
  '[data-theme="inverse"]',
]);

const entry = join(game, "styles.css");
const sheets = all.filter(
  (file) => file.endsWith(".css") && inGame(file) && file !== entry,
);
const parsed = sheets.map((file) => ({ file, ...parse(file) }));
const rules = parsed.flatMap((sheet) => sheet.rules);

describe("Game 实机风格的样式引了也动不到主库的控件", () => {
  it("每个控件的样式表都汇进了 styles.css 的 components 层", () => {
    const { statements } = parse(entry);
    expect(statements[0]).toBe("@layer theme, base, components, utilities");
    const imported = statements
      .slice(1)
      .map((statement) => {
        const match = /^@import "\.\/([^"]+)" layer\(components\)$/.exec(
          statement,
        );
        expect(
          match,
          `styles.css 里这一句不合规矩：${statement}`,
        ).not.toBeNull();
        return match![1]!;
      })
      .sort();
    const present = sheets
      .map((file) => relative(game, file).split(sep).join("/"))
      .sort();
    expect(imported).toEqual(present);
  });

  it("规则只以 .ef- 类起头；主题范围上的那几条只声明 --ef-game-* 变量", () => {
    const offenders: string[] = [];
    for (const rule of rules) {
      const scoped = rule.selectors.every((selector) =>
        /^[a-z]*\.ef-/.test(selector),
      );
      if (scoped) continue;
      const themed =
        rule.selectors.every((selector) => THEME_SCOPES.has(selector)) &&
        declarations(rule.body).every((name) => name.startsWith("--ef-game-"));
      if (!themed) {
        offenders.push(`${show(rule.file)}：${rule.selectors.join(", ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("声明的变量都叫 --ef-game-*，不占主库令牌的名字", () => {
    const offenders = rules.flatMap((rule) =>
      customProperties(rule.body)
        .filter((name) => !name.startsWith("--ef-game-"))
        .map((name) => `${show(rule.file)}：${name}`),
    );
    expect(offenders).toEqual([]);
  });

  it("@keyframes 的名字都带 ef- 前缀", () => {
    const offenders = parsed.flatMap((sheet) =>
      sheet.keyframes
        .filter((name) => !name.startsWith("ef-"))
        .map((name) => `${show(sheet.file)}：${name}`),
    );
    expect(offenders).toEqual([]);
  });
});
