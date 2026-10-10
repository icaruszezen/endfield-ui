// 分段选择：键盘换值、只占一个 Tab 停靠点、各段等宽、选中段看得出来、窄了截断
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const GROUP = "#storybook-root [role=radiogroup]";

const checked = (page: Page) =>
  page.evaluate(
    (css) =>
      [...document.querySelectorAll<HTMLInputElement>(`${css} input`)]
        .filter((input) => input.checked)
        .map((input) => input.value),
    GROUP,
  );

/** 焦点在哪一段上：单选按钮没有自己的文字，按它的值认 */
const waitFocusedValue = (page: Page, value: string, message: string) =>
  page.waitFor(
    () =>
      page.evaluate((expected) => {
        const element = document.activeElement;
        return (
          element instanceof HTMLInputElement &&
          element.type === "radio" &&
          element.value === expected
        );
      }, value),
    message,
  );

/**
 * 选中的那块底画在轨道的 ::after 上：它和第几段重合（从 0 起）；哪一段都不重合是 -1，
 * 没画出来是 null
 */
const blockOn = (page: Page, selector = GROUP) =>
  page.evaluate((css) => {
    const group = document.querySelector<HTMLElement>(css)!;
    const style = getComputedStyle(group, "::after");
    if (style.display === "none" || style.opacity === "0") return null;
    const [x = 0, y = 0] = style.translate
      .split(" ")
      .map((part) => Number.parseFloat(part) || 0);
    const box = group.getBoundingClientRect();
    const near = (a: number, b: number) => Math.abs(a - b) < 0.5;
    return [...group.querySelectorAll("label")].findIndex((label) => {
      const rect = label.getBoundingClientRect();
      return (
        near(rect.left - box.left - group.clientLeft, x) &&
        near(rect.top - box.top - group.clientTop, y) &&
        near(rect.width, Number.parseFloat(style.width)) &&
        near(rect.height, Number.parseFloat(style.height))
      );
    });
  }, selector);

test("键盘：Tab 进来停在选中的那一段，方向键换值，到头绕回去", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--playground");
  assert.deepEqual(await checked(page), ["24"]);

  await page.key("Tab");
  await waitFocusedValue(page, "24", "Tab 应该停在选中的那一段上");
  await page.key("ArrowRight");
  await page.waitFor(
    async () => (await checked(page)).join() === "12",
    "→ 应该选中下一段",
  );
  await page.key("ArrowRight");
  await page.key("ArrowRight");
  await page.waitFor(
    async () => (await checked(page)).join() === "24",
    "到头再按 → 应该绕回第一段",
  );
  await page.key("ArrowLeft");
  await page.waitFor(
    async () => (await checked(page)).join() === "auto",
    "第一段按 ← 应该绕到最后一段",
  );
});

test("有焦点的那一段上有焦点环", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--playground");
  await page.key("Tab");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const segment = document.activeElement!.closest("label")!;
        const style = getComputedStyle(segment);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }),
    "键盘聚焦时，那一段上应该有焦点环",
  );
  // 鼠标点的不画环
  await page.story("控件-segmentedcontrol-分段选择--playground");
  await page.click(`${GROUP} label:nth-child(2)`);
  await page.waitFor(
    async () => (await checked(page)).join() === "12",
    "点第二段应该选中它",
  );
  await page.frames();
  assert.equal(
    await page.evaluate(
      (css) =>
        getComputedStyle(document.querySelector(`${css} label:nth-child(2)`)!)
          .outlineStyle,
      GROUP,
    ),
    "none",
    "鼠标点的不应该出现焦点环",
  );
});

test("整个控件只占一个 Tab 停靠点", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--in-field");
  await page.key("Tab");
  await waitFocusedValue(page, "24", "Tab 应该停在第一组选中的那一段上");
  await page.key("Tab");
  // 第二组一个都没选：停在第一段上
  await waitFocusedValue(page, "a", "再按 Tab 应该到第二组的第一段");
  await page.key("Tab");
  await page.waitFocused(/^combobox:/, "再按 Tab 应该离开分段选择，到下拉上");
});

test("各段等宽；选中的块和轨道、和没选的段都分得开（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-segmentedcontrol-分段选择--playground", theme);
    await page.settled(GROUP);
    assert.equal(
      await blockOn(page),
      0,
      `${theme}：选中的块应该正好盖住第一段`,
    );
    const found = await page.evaluate((css) => {
      const group = document.querySelector<HTMLElement>(css)!;
      const segments = [...group.querySelectorAll<HTMLElement>("label")];
      const luminance = (color: string) => {
        const [r, g, b] = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map((value) => {
            const channel = Number(value) / 255;
            return channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4;
          });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const contrast = (a: string, b: string) => {
        const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (high! + 0.05) / (low! + 0.05);
      };
      const selected = getComputedStyle(segments[0]!);
      // 选中的底是轨道上滑动的那一块，那一段自己不画
      const block = getComputedStyle(group, "::after").backgroundColor;
      return {
        widths: segments.map((segment) => Math.round(segment.offsetWidth)),
        height: group.offsetHeight,
        ownFill: selected.backgroundColor,
        // 选中的块对轨道
        block: contrast(block, getComputedStyle(group).backgroundColor),
        // 选中块里的字
        text: contrast(selected.color, block),
        weightSame:
          selected.fontWeight === getComputedStyle(segments[1]!).fontWeight,
      };
    }, GROUP);
    assert.equal(new Set(found.widths).size, 1, `${theme}：各段应该等宽`);
    assert.equal(found.height, 40);
    assert.equal(
      found.ownFill,
      "rgba(0, 0, 0, 0)",
      `${theme}：量到位置之后，选中的那一段自己不该再画底`,
    );
    assert.ok(found.block >= 3, `${theme}：选中的块对轨道只有 ${found.block}`);
    assert.ok(found.text >= 4.5, `${theme}：选中块里的字只有 ${found.text}`);
    assert.ok(found.weightSame, "选中不加粗：加粗会让宽度跳");
  }
});

test("选中的块换到另一段：整条的宽度不变", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--playground");
  const width = () =>
    page.evaluate(
      (css) => document.querySelector(css)!.getBoundingClientRect().width,
      GROUP,
    );
  const before = await width();
  await page.click(`${GROUP} label:nth-child(3)`);
  await page.waitFor(
    async () => (await checked(page)).join() === "auto",
    "点第三段应该选中它",
  );
  await page.settled(GROUP);
  assert.equal(await width(), before);
  assert.equal(await blockOn(page), 2, "选中的块应该跟到第三段上");
});

test("没选时没有块；整组禁用时块是禁用色；第一次选，块出现在点的那一段上", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--states");
  const nth = (index: number) =>
    `#storybook-root [role=radiogroup]:nth-child(${index})`;
  await page.settled("#storybook-root");
  assert.equal(await blockOn(page, nth(1)), null, "一个都没选：不该有块");
  assert.equal(await blockOn(page, nth(2)), 1);
  assert.equal(await blockOn(page, nth(3)), 0);

  const fills = await page.evaluate(() => {
    const color = (variable: string) => {
      const probe = document.createElement("i");
      probe.style.color = `var(${variable})`;
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const groups = [
      ...document.querySelectorAll("#storybook-root [role=radiogroup]"),
    ];
    const fill = (group: Element) =>
      getComputedStyle(group, "::after").backgroundColor;
    return {
      disabled: fill(groups[1]!) === color("--ef-disabled"),
      enabled: fill(groups[2]!) === color("--ef-surface-inverse"),
    };
  });
  assert.deepEqual(fills, { disabled: true, enabled: true });

  await page.click(`${nth(1)} label:nth-child(2)`);
  await page.waitFor(
    async () => (await blockOn(page, nth(1))) === 1,
    "选了第二段：块应该出现在它上面",
  );
});

test("放进字段：名称来自标签；值随表单提交；没选时报错、选了就消", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--in-field");
  const groups = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root [role=radiogroup]")].map(
        (group) => ({
          name: document.getElementById(
            group.getAttribute("aria-labelledby") ?? "",
          )?.textContent,
          invalid: group.getAttribute("aria-invalid"),
        }),
      ),
    );
  const names = (await groups()).map((group) => group.name);
  assert.match(names[0] ?? "", /时间显示/);
  assert.match(names[1] ?? "", /值守班次/);

  await page.click("text=保存");
  await page.waitFor(
    async () => (await groups())[1]!.invalid === "true",
    "没选班次就提交：这一组应该是错误态",
  );
  // 错误态的边线是红的
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const probe = document.createElement("i");
        probe.style.color = "var(--ef-danger)";
        document.body.append(probe);
        const danger = getComputedStyle(probe).color;
        probe.remove();
        const group = document.querySelectorAll(
          "#storybook-root [role=radiogroup]",
        )[1]!;
        return getComputedStyle(group).borderBottomColor === danger;
      }),
    "错误态的底边线应该是 danger",
  );

  await page.click("text=乙班");
  await page.waitFor(
    async () => (await groups())[1]!.invalid === null,
    "选了之后错误应该消掉",
  );
  await page.click("text=保存");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root output"))[0] === "clock=24&shift=b",
    "提交的值应该是两组各自选中的那一段",
  );
});

test("禁用的段点不动，键盘也跳过它", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--states");
  const third = "#storybook-root [role=radiogroup]:nth-child(3)";
  const value = () =>
    page.evaluate(
      (css) =>
        document.querySelector<HTMLInputElement>(`${css} input:checked`)
          ?.value ?? null,
      third,
    );
  assert.equal(await value(), "a");
  await page.click(`${third} label:nth-child(3)`);
  await page.pause(300);
  assert.equal(await value(), "a", "禁用的那一段不应该被选中");

  await page.click(`${third} label:nth-child(2)`);
  await page.waitFor(async () => (await value()) === "b", "第二段选得中");
  await page.key("ArrowRight");
  await page.waitFor(
    async () => (await value()) === "a",
    "→ 应该跳过禁用的第三段，绕回第一段",
  );
});

test("窄容器：整条不超出容器，放不下的文字截断", async () => {
  const { page } = storybook;
  await page.story("控件-segmentedcontrol-分段选择--narrow");
  const found = await page.evaluate((css) => {
    const group = document.querySelector<HTMLElement>(css)!;
    const box = group.parentElement!.getBoundingClientRect();
    const rect = group.getBoundingClientRect();
    const text = group.querySelector<HTMLElement>("label span")!;
    return {
      inside: rect.right <= box.right + 0.5 && rect.left >= box.left - 0.5,
      truncated: text.scrollWidth > text.clientWidth,
      oneLine: group.offsetHeight === 40,
    };
  }, GROUP);
  assert.deepEqual(found, { inside: true, truncated: true, oneLine: true });
});
