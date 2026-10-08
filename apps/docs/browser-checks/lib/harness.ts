/*
 * 每个检查文件开头调一次 `useStorybook()`：起一个浏览器（和一个静态服务器），
 * 文件跑完关掉；哪条检查没过，就把当时的画面存到 `.artifacts/`。
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { after, afterEach, before } from "node:test";
import { fileURLToPath } from "node:url";
import { launch, type Page } from "./browser.ts";
import { serve } from "./server.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const staticDir = join(here, "..", "..", "storybook-static");
const artifactsDir = join(here, "..", ".artifacts");

export type { Page } from "./browser.ts";

export function useStorybook(size: { width?: number; height?: number } = {}) {
  let page: Page | undefined;
  let server: Awaited<ReturnType<typeof serve>> | undefined;

  before(async () => {
    // 设了 STORYBOOK_URL 就测那个地址：正在跑的开发服务器，或者在线站点
    let baseUrl = process.env.STORYBOOK_URL?.replace(/\/$/, "");
    if (!baseUrl) {
      assert.ok(
        existsSync(join(staticDir, "iframe.html")),
        "没有找到 storybook-static。先跑 pnpm build:docs，或者用 STORYBOOK_URL 指向一个正在跑的 Storybook。",
      );
      server = await serve(staticDir);
      baseUrl = server.url;
    }
    page = await launch({ baseUrl, ...size });
  });

  afterEach(async (context) => {
    // `passed` 从 Node 20.12 起就有，只是 @types/node 还没写进去
    const { passed } = context as typeof context & { passed: boolean };
    if (passed || !page) return;
    const name = context.name.replace(/[^\p{L}\p{N}]+/gu, "-");
    await page.screenshot(join(artifactsDir, `${name}.png`));
  });

  after(async () => {
    await page?.close();
    await server?.close();
  });

  return {
    get page() {
      assert.ok(page, "浏览器还没起来：只能在 test() 里面用");
      return page;
    },
  };
}
