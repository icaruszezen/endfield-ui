// 预览站本身（.storybook/manager.tsx）：工具栏上到仓库的链接
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook } from "./lib/harness.ts";

const storybook = useStorybook({ width: 1280, height: 900 });

const REPO_URL = "https://github.com/icaruszezen/endfield-ui";
const LINK = `[data-testid=sb-preview-toolbar] a[href="${REPO_URL}"]`;

// 单个 story 和文档页用的是同一条工具栏，但左边那组工具不一样，两种都看
const pages = [
  ["文档页", "/docs/示例-内容页--docs"],
  ["单个 story", "/story/示例-仓库页--page"],
] as const;

for (const [name, path] of pages) {
  test(`工具栏上有到仓库的链接，不用滚就看得到：${name}`, async () => {
    const { page } = storybook;
    await page.manager(path);
    await page.waitVisible(LINK, "工具栏上没有到仓库的链接");

    const link = await page.evaluate((css) => {
      const element = document.querySelector<HTMLAnchorElement>(css)!;
      const rect = element.getBoundingClientRect();
      return {
        text: (element.textContent ?? "").trim(),
        target: element.target,
        inView: rect.left >= 0 && rect.right <= window.innerWidth,
      };
    }, LINK);
    assert.equal(link.text, "GitHub", "链接上要有字，不只是一个图标");
    assert.equal(link.target, "_blank", "要开在新标签页，不把预览站换掉");
    assert.ok(link.inView, "链接被挤到工具栏看不见的那一段去了");
  });
}
