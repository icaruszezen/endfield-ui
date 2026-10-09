// 步骤条：横排在窄容器里改成竖排、三种节点分得开、做过的步骤点得回去
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const LIST = "#storybook-root ol";

const layout = (page: Page) =>
  page.evaluate((css) => {
    const list = document.querySelector(css)!;
    const steps = [...list.querySelectorAll(":scope > li")];
    const nodes = steps.map((step) =>
      step.querySelector("[aria-hidden=true] > span")!.getBoundingClientRect(),
    );
    return {
      tops: nodes.map((rect) => Math.round(rect.top)),
      lefts: nodes.map((rect) => Math.round(rect.left)),
      widths: steps.map((step) =>
        Math.round(step.getBoundingClientRect().width),
      ),
      node: [nodes[0]!.width, nodes[0]!.height],
      statuses: steps.map((step) => step.getAttribute("data-status")),
      current: steps.findIndex(
        (step) => step.getAttribute("aria-current") === "step",
      ),
    };
  }, LIST);

test("横排：节点在同一行，各步等宽，当前步带 aria-current", async () => {
  const { page } = storybook;
  await page.story("控件-steps-步骤条--playground");
  const found = await layout(page);
  assert.equal(new Set(found.tops).size, 1, "节点应该在同一行");
  assert.equal(new Set(found.widths).size, 1, "各步应该等宽");
  assert.ok(
    found.lefts.every(
      (left, index) => index === 0 || left > found.lefts[index - 1]!,
    ),
    "节点应该从左到右排开",
  );
  assert.deepEqual(found.node, [24, 24]);
  assert.deepEqual(found.statuses, ["done", "current", "upcoming", "upcoming"]);
  assert.equal(found.current, 1);
});

test("横排：线接在节点右边，和两头的节点各隔 8px；标题在节点下面左对齐", async () => {
  const { page } = storybook;
  await page.story("控件-steps-步骤条--playground");
  const found = await page.evaluate((css) => {
    const steps = [...document.querySelectorAll(`${css} > li`)];
    const rail = steps[0]!.querySelector("[aria-hidden=true]")!;
    const node = rail.children[0]!.getBoundingClientRect();
    const line = rail.children[1]!.getBoundingClientRect();
    const next = steps[1]!
      .querySelector("[aria-hidden=true] > span")!
      .getBoundingClientRect();
    const title = steps[0]!
      .querySelector(":scope > div")!
      .getBoundingClientRect();
    return {
      gapBefore: Math.round(line.left - node.right),
      gapAfter: Math.round(next.left - line.right),
      thickness: line.height,
      // 线在节点的中线上
      centered: Math.abs(line.top + line.height / 2 - (node.top + 12)) < 1,
      titleBelow: title.top >= node.bottom,
      titleLeft: Math.round(title.left - node.left),
    };
  }, LIST);
  assert.deepEqual(found, {
    gapBefore: 8,
    gapAfter: 8,
    thickness: 2,
    centered: true,
    titleBelow: true,
    titleLeft: 0,
  });
});

test("窄容器里自动改成竖排：节点在同一列，文字在节点右边", async () => {
  const { page } = storybook;
  await page.story("控件-steps-步骤条--narrow");
  const found = await layout(page);
  assert.equal(new Set(found.lefts).size, 1, "节点应该在同一列");
  assert.ok(
    found.tops.every(
      (top, index) => index === 0 || top > found.tops[index - 1]!,
    ),
    "节点应该从上到下排开",
  );
  const beside = await page.evaluate((css) => {
    const step = document.querySelector(`${css} > li`)!;
    const node = step
      .querySelector("[aria-hidden=true] > span")!
      .getBoundingClientRect();
    const body = step.querySelector(":scope > div")!.getBoundingClientRect();
    const line = step
      .querySelector("[aria-hidden=true] > span:last-child")!
      .getBoundingClientRect();
    return {
      right: body.left >= node.right,
      sameRow: Math.abs(body.top - node.top) < 1,
      // 线往下接：细的是宽，不是高
      vertical: line.width === 2 && line.height > 8,
    };
  }, LIST);
  assert.deepEqual(beside, { right: true, sameRow: true, vertical: true });
});

test("看的是容器的宽度：同一个横排的步骤条，容器变窄就改成竖排", async () => {
  const { page } = storybook;
  await page.story("控件-steps-步骤条--playground");
  assert.equal(new Set((await layout(page)).tops).size, 1);
  await page.setSize(380, 800);
  try {
    await page.waitFor(
      async () => new Set((await layout(page)).lefts).size === 1,
      "视口变窄之后应该改成竖排",
    );
  } finally {
    await page.setSize(1200, 800);
  }
  await page.waitFor(
    async () => new Set((await layout(page)).tops).size === 1,
    "变宽之后应该回到横排",
  );
});

test("orientation=vertical：容器再宽也是竖排", async () => {
  const { page } = storybook;
  await page.story("控件-steps-步骤条--vertical");
  const found = await layout(page);
  assert.equal(new Set(found.lefts).size, 1);
  assert.equal(new Set(found.tops).size, 4);
});

test("三种节点分得开：勾、实心的序号、空心的序号（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-steps-步骤条--playground", theme);
    await page.frames();
    const nodes = await page.evaluate((css) => {
      const probe = (value: string) => {
        const element = document.createElement("i");
        element.style.backgroundColor = value;
        document.body.append(element);
        const color = getComputedStyle(element).backgroundColor;
        element.remove();
        return color;
      };
      const tokens = {
        inverse: probe("var(--ef-surface-inverse)"),
        action: probe("var(--ef-action)"),
        ink: probe("var(--ef-ink)"),
      };
      return [...document.querySelectorAll(`${css} > li`)].map((step) => {
        const node = step.querySelector<HTMLElement>(
          "[aria-hidden=true] > span",
        )!;
        const style = getComputedStyle(node);
        return {
          text: node.textContent,
          icon: node.querySelector("svg") !== null,
          fill:
            style.backgroundColor === tokens.inverse
              ? "inverse"
              : style.backgroundColor === tokens.action
                ? "action"
                : "none",
          border: style.borderTopWidth,
          borderIsInk: style.borderTopColor === tokens.ink,
        };
      });
    }, LIST);
    assert.deepEqual(
      nodes.map(({ text, icon, fill, border }) => ({
        text,
        icon,
        fill,
        border,
      })),
      [
        { text: "", icon: true, fill: "inverse", border: "0px" },
        { text: "02", icon: false, fill: "action", border: "1px" },
        { text: "03", icon: false, fill: "none", border: "1px" },
        { text: "04", icon: false, fill: "none", border: "1px" },
      ],
      theme,
    );
    assert.ok(nodes[1]!.borderIsInk, `${theme}：当前节点的描边跟着文字色走`);
    assert.ok(!nodes[2]!.borderIsInk, `${theme}：未到的节点是浅线`);
  }
});

test("做过的步骤可以点回去：键盘到得了，焦点环画在那一步上；没到的不是控件", async () => {
  const { page } = storybook;
  await page.story("控件-steps-步骤条--clickable");
  const status = async () =>
    (await page.text("#storybook-root [role=status]"))[0];
  assert.equal(await status(), "现在是第 3 步：复核");
  assert.equal(
    await page.evaluate(
      (css) => document.querySelectorAll(`${css} button`).length,
      LIST,
    ),
    2,
    "只有做过的两步是按钮",
  );

  await page.key("Tab");
  await page.waitFocused("button:已完成：建站");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!.closest("li")!);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }),
    "键盘聚焦时，焦点环应该画在这一步上",
  );
  await page.key("Tab");
  await page.waitFocused("button:已完成：测绘");
  await page.key("Enter");
  await page.waitFor(
    async () => (await status()) === "现在是第 2 步：测绘",
    "回车应该回到第二步",
  );
  assert.equal((await layout(page)).current, 1);

  // 点击范围铺满这一步：点说明文字也算
  const description = await page.evaluate((css) => {
    const rect = document
      .querySelector(`${css} > li:first-child > div > div:last-child`)!
      .getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, LIST);
  await page.click(description);
  await page.waitFor(
    async () => (await status()) === "现在是第 1 步：建站",
    "点第一步的说明文字应该回到第一步",
  );
});

test("有误的那一步：节点换成红色的警示图标，状态不变", async () => {
  const { page } = storybook;
  await page.story("控件-steps-步骤条--invalid");
  await page.frames();
  const found = await page.evaluate((css) => {
    const probe = document.createElement("i");
    probe.style.color = "var(--ef-danger)";
    document.body.append(probe);
    const danger = getComputedStyle(probe).color;
    probe.remove();
    const step = document.querySelectorAll(`${css} > li`)[1]!;
    const node = step.querySelector<HTMLElement>("[aria-hidden=true] > span")!;
    const style = getComputedStyle(node);
    return {
      status: step.getAttribute("data-status"),
      icon: node.querySelector("svg") !== null,
      red: style.color === danger && style.borderTopColor === danger,
      spoken: step.querySelector(".sr-only")!.textContent,
    };
  }, LIST);
  assert.deepEqual(found, {
    status: "done",
    icon: true,
    red: true,
    spoken: "已完成，有误：",
  });
});
