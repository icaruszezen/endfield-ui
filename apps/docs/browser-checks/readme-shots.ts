// 根 README 里的示例页截图。不是检查（文件名不带 .check，test:browser 不会跑它）：
// 示例页改了样子之后，先 pnpm build:docs，再 pnpm --filter @endfield-ui/docs shots 重截
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { launch, type Theme } from "./lib/browser.ts";
import { serve } from "./lib/server.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const staticDir = join(here, "..", "storybook-static");
const outDir = join(here, "..", "..", "..", "docs", "screenshots");

// 文件名、story、主题。README 里每张图的链接要和这里的 story、主题对上
const shots: [file: string, story: string, theme: Theme][] = [
  ["depot-dark", "示例-仓库页--page", "dark"],
  ["dispatch-dark", "示例-调度台--page", "dark"],
  ["content-light", "示例-内容页--page", "light"],
  ["settings-light", "示例-设置页--page", "light"],
  ["list-dark", "示例-列表页--page", "dark"],
  ["takeover", "示例-主题色接管--takeover", "both"],
];

assert.ok(
  existsSync(join(staticDir, "iframe.html")),
  "没有找到 storybook-static。先跑 pnpm build:docs。",
);

const server = await serve(staticDir);
const page = await launch({ baseUrl: server.url, width: 1200, height: 750 });
try {
  for (const [file, story, theme] of shots) {
    await page.story(story, theme);
    // 分节标题进了视口才开始入场，先等几帧让它起头，再等到播完：
    // 截早了只有滑块、没有字。转个不停的（刻度圆环）不等
    await page.frames(4);
    await page.waitFor(
      () =>
        page.evaluate(
          () =>
            [...document.images].every((image) => image.complete) &&
            document
              .getAnimations()
              .every(
                (animation) =>
                  animation.playState === "finished" ||
                  animation.effect?.getComputedTiming().iterations === Infinity,
              ),
        ),
      `${story} 一直没有静下来`,
    );
    await page.screenshot(join(outDir, `${file}.png`));
    console.log(`${file}.png`);
  }
} finally {
  await page.close();
  await server.close();
}
