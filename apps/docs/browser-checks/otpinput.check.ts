// 验证码输入：逐位输入与跳格、方向键、退格、粘贴、状态色、窄容器、表单值
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

/** 第一组验证码的每一格（不算提交用的隐藏字段） */
const SLOTS = "#storybook-root [role=group] input:not([aria-hidden])";

/** 各格的值，和焦点在第几格（不在里面是 -1）。`group` 是页面上的第几组 */
const read = (page: Page, group = 0) =>
  page.evaluate((nth) => {
    const root = document.querySelectorAll("#storybook-root [role=group]")[
      nth
    ]!;
    const slots = [
      ...root.querySelectorAll<HTMLInputElement>("input:not([aria-hidden])"),
    ];
    return {
      values: slots.map((slot) => slot.value),
      focus: slots.indexOf(document.activeElement as HTMLInputElement),
    };
  }, group);

/** 某一格的中心点 */
const slotPoint = (page: Page, index: number, group = 0) =>
  page.evaluate(
    ({ nth, slot }) => {
      const root = document.querySelectorAll("#storybook-root [role=group]")[
        nth
      ]!;
      const rect = root
        .querySelectorAll("input:not([aria-hidden])")
        [slot]!.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    },
    { nth: group, slot: index },
  );

const token = (page: Page, value: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("i");
    probe.style.color = color;
    document.querySelector("#storybook-root")!.append(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return computed;
  }, value);

/** 某一格底边线的颜色 */
const borderOf = (page: Page, index: number, group = 0) =>
  page.evaluate(
    ({ nth, slot }) => {
      const root = document.querySelectorAll("#storybook-root [role=group]")[
        nth
      ]!;
      return getComputedStyle(
        root.querySelectorAll("input:not([aria-hidden])")[slot]!,
      ).borderBottomColor;
    },
    { nth: group, slot: index },
  );

test("打六位：每打一位跳一格；填满后按钮可用，提交的是拼起来的那一串", async () => {
  const { page } = storybook;
  await page.story("控件-otpinput-验证码输入--in-field");

  await page.key("Tab");
  await page.waitFor(
    async () => (await read(page)).focus === 0,
    "Tab 进来焦点应该在第一格",
  );

  await page.type("20");
  await page.waitFor(async () => {
    const now = await read(page);
    return now.values.join("") === "20" && now.focus === 2;
  }, "打了两位，焦点应该在第三格");

  await page.type("4157");
  await page.waitFor(
    async () => (await read(page)).values.join("") === "204157",
    "六位都应该填上",
  );

  // 口令对了，提交按钮才可用
  await page.waitFor(
    () =>
      page.evaluate(
        () =>
          !document.querySelector<HTMLButtonElement>(
            "#storybook-root button[type=submit]",
          )!.disabled,
      ),
    "口令对了之后提交按钮应该可用",
  );
  await page.click("#storybook-root button[type=submit]");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] ===
      "// 提交的是 204157",
    "表单提交的应该是拼起来的那一串",
  );
});

test("口令不对：字段报错，每一格的底边线变成危险色", async () => {
  const { page } = storybook;
  await page.story("控件-otpinput-验证码输入--in-field");
  const danger = await token(page, "var(--ef-danger)");

  await page.click(await slotPoint(page, 0));
  await page.type("204158");
  await page.waitFor(
    () =>
      page.evaluate(() =>
        document
          .querySelector("#storybook-root")!
          .textContent!.includes("口令不对，再核对一遍交接单。"),
      ),
    "填满了但不对，字段应该报错",
  );
  for (const index of [0, 3, 5]) {
    await page.waitEqual(
      () => borderOf(page, index),
      danger,
      `第 ${index + 1} 格的底边线应该是危险色`,
    );
  }
  assert.equal(
    await page.evaluate(
      (css) =>
        [...document.querySelectorAll(css)].every(
          (slot) => slot.getAttribute("aria-invalid") === "true",
        ),
      SLOTS,
    ),
    true,
    "每一格都应该标成不合规",
  );
});

test("方向键在格子之间走；Backspace 删掉这一位并退一格", async () => {
  const { page } = storybook;
  await page.story("控件-otpinput-验证码输入--grouped");

  await page.click(await slotPoint(page, 2));
  await page.waitFor(
    async () => (await read(page)).focus === 2,
    "点第三格，焦点应该在第三格",
  );
  await page.key("ArrowRight");
  await page.waitFor(async () => (await read(page)).focus === 3, "→ 到第四格");
  await page.key("ArrowLeft");
  await page.key("ArrowLeft");
  await page.waitFor(
    async () => (await read(page)).focus === 1,
    "← 两次到第二格",
  );

  await page.key("End");
  await page.waitFor(
    async () => (await read(page)).focus === 5,
    "End 到最后一格",
  );
  await page.key("Backspace");
  await page.waitFor(async () => {
    const now = await read(page);
    return now.values.join("") === "20415" && now.focus === 4;
  }, "Backspace 应该删掉最后一位，焦点退到前一格");
});

test("粘贴一整串：分到各格，空白去掉，多出来的不要", async () => {
  const { page } = storybook;
  await page.story("控件-otpinput-验证码输入--playground");
  await page.click(await slotPoint(page, 0));
  await page.waitFor(
    async () => (await read(page)).focus === 0,
    "焦点在第一格",
  );

  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/plain", " 204 157 99");
    document.activeElement!.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await page.waitFor(
    async () => (await read(page)).values.join("") === "204157",
    "粘贴进来的一串应该分到六格里",
  );
});

test("聚焦的那一格：底边线变墨色，带焦点环；别的格还是平时的线（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-otpinput-验证码输入--playground", theme);
    const ink = await token(page, "var(--ef-ink)");
    const rest = await token(page, "var(--ef-line-strong)");
    assert.notEqual(ink, rest);

    await page.waitEqual(() => borderOf(page, 0), rest, `${theme}：平时的线`);
    await page.key("Tab");
    await page.waitFor(async () => (await read(page)).focus === 0, "Tab 进来");
    await page.waitEqual(
      () => borderOf(page, 0),
      ink,
      `${theme}：聚焦的那一格底边线是墨色`,
    );
    await page.waitEqual(
      () => borderOf(page, 1),
      rest,
      `${theme}：没聚焦的格还是平时的线`,
    );
    await page.waitFor(
      () =>
        page.evaluate(() => {
          const style = getComputedStyle(document.activeElement!);
          return style.outlineStyle === "solid" && style.outlineWidth === "2px";
        }),
      `${theme}：聚焦的那一格应该有焦点环`,
    );
  }
});

test("格子见方；三位一组的短横在第三、四格之间，上下居中", async () => {
  const { page } = storybook;
  await page.story("控件-otpinput-验证码输入--grouped");
  const found = await page.evaluate(() => {
    const root = document.querySelector("#storybook-root [role=group]")!;
    const slots = [...root.querySelectorAll("input:not([aria-hidden])")].map(
      (slot) => slot.getBoundingClientRect(),
    );
    const dash = root
      .querySelector("[data-separator]")!
      .getBoundingClientRect();
    const middle = (rect: DOMRect) => (rect.top + rect.bottom) / 2;
    return {
      sizes: [...new Set(slots.map((rect) => `${rect.width}x${rect.height}`))],
      between: dash.left >= slots[2]!.right && dash.right <= slots[3]!.left,
      centered: Math.abs(middle(dash) - middle(slots[2]!)) < 0.5,
      dash: [dash.width, dash.height],
      // 同一组里格子之间 8px
      gap: slots[1]!.left - slots[0]!.right,
    };
  });
  assert.deepEqual(found, {
    sizes: ["40x40"],
    between: true,
    centered: true,
    dash: [8, 2],
    gap: 8,
  });
});

test("窄容器：大号的格子变窄、高度不变，整排不伸出容器", async () => {
  const { page } = storybook;
  await page.story("控件-otpinput-验证码输入--narrow");
  const found = await page.evaluate(() => {
    const root = document.querySelector("#storybook-root [role=group]")!;
    const box = root.parentElement!.getBoundingClientRect();
    const slots = [...root.querySelectorAll("input:not([aria-hidden])")].map(
      (slot) => slot.getBoundingClientRect(),
    );
    return {
      count: slots.length,
      heights: [...new Set(slots.map((rect) => rect.height))],
      narrower: slots.every((rect) => rect.width < 56 && rect.width > 12),
      inside: slots.at(-1)!.right <= box.right + 0.5,
      oneRow: new Set(slots.map((rect) => rect.top)).size === 1,
    };
  });
  // 容器里只有 198px：六格各 56px 怎么都放不下（和字体无关）
  assert.deepEqual(found, {
    count: 6,
    heights: [56],
    narrower: true,
    inside: true,
    oneRow: true,
  });
});

test("点字段的标签，焦点落在第一格", async () => {
  const { page } = storybook;
  await page.story("控件-otpinput-验证码输入--outline");
  await page.click("#storybook-root label");
  await page.waitFor(
    async () => (await read(page)).focus === 0,
    "点标签焦点应该落在第一格",
  );
});
