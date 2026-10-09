// 组合框：打字筛选、键盘选中、Esc、清除钮、多选的小块与退格、面板的位置
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const INPUT = "input[role=combobox]";
const PANEL = "[role=listbox]";

const inputValue = (page: Page) =>
  page.evaluate(
    () =>
      document.querySelector<HTMLInputElement>("input[role=combobox]")!.value,
  );

/** 面板里看得见的选项 */
const options = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[role=listbox] [role=option]")]
      .filter((option) => option.getBoundingClientRect().height > 0)
      .map((option) => (option.textContent ?? "").trim()),
  );

const highlighted = (page: Page) =>
  page.evaluate(
    () =>
      document
        .querySelector("[role=option][data-highlighted]")
        ?.textContent?.trim() ?? null,
  );

/** 面板里那句"没有匹配"的说明看得见吗。这时列表本身是收起的 */
const emptyNote = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("body *")].some(
      (element) =>
        element.children.length === 0 &&
        element.textContent === "没有匹配的选项" &&
        element.getBoundingClientRect().height > 0,
    ),
  );

/** 框里的小块 */
const chips = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll("#storybook-root button[aria-label^=移除]"),
    ].map((button) => button.getAttribute("aria-label")!.replace("移除", "")),
  );

test("打字即筛选并打开面板：按文字找，也能按编号找", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--playground");
  await page.key("Tab");
  await page.waitFocused("combobox:站点");

  await page.type("西坡");
  await page.waitVisible(PANEL);
  const found = await page.waitFor(async () => {
    const list = await options(page);
    return list.length > 0 && list.every((text) => text.startsWith("西坡"))
      ? list
      : null;
  }, "输入西坡之后面板里应该只剩西坡的站");
  assert.equal(found.length, 5);

  // 清掉重打：编号不显示，但能搜到
  for (let i = 0; i < 2; i++) await page.key("Backspace");
  await page.type("s-03");
  await page.waitFor(
    async () => (await options(page)).join() === "南岸三号站",
    "按编号 s-03 应该找到南岸三号站",
  );
});

test("键盘：方向键移动，回车选中，面板关上，焦点留在输入框里", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--playground");
  await page.key("Tab");
  await page.type("北区");
  await page.waitVisible(PANEL);

  await page.key("ArrowDown");
  const first = await page.waitFor(() => highlighted(page), "没有高亮的选项");
  await page.key("ArrowDown");
  const second = await page.waitFor(async () => {
    const now = await highlighted(page);
    return now !== first ? now : null;
  }, "方向键应该把高亮移到下一项");

  // 焦点一直在输入框里，读屏靠 aria-activedescendant 知道移到了哪
  assert.ok(
    await page.evaluate(() => {
      const input = document.activeElement!;
      const id = input.getAttribute("aria-activedescendant");
      return (
        input.matches("input[role=combobox]") &&
        !!id &&
        document.getElementById(id)?.hasAttribute("data-highlighted")
      );
    }),
    "输入框的 aria-activedescendant 应该指着高亮的选项",
  );

  await page.key("Enter");
  await page.waitGone(PANEL, "选中后面板应该关上");
  assert.equal(await inputValue(page), second);
  await page.waitFocused("combobox:站点");
});

test("没有匹配时面板里是一句说明；Esc 先关面板", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--playground");
  await page.key("Tab");
  await page.type("zzz");
  await page.waitFor(
    async () => (await emptyNote(page)) && (await options(page)).length === 0,
    "面板里应该是那句没有匹配的说明",
  );

  await page.key("Escape");
  await page.waitFor(
    async () => !(await emptyNote(page)),
    "Esc 应该把面板关上",
  );
  await page.waitFocused("combobox:站点", "Esc 之后焦点应该还在输入框里");
});

test("打了一半没选就离开：输入框回到原来的值", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--groups");
  const before = await inputValue(page);
  assert.equal(before, "南岸二号站");

  await page.key("Tab");
  await page.type("zzz");
  await page.waitFor(() => emptyNote(page), "面板应该打开");
  await page.click("body");
  await page.waitFor(
    async () => !(await emptyNote(page)),
    "点外面应该把面板关上",
  );
  await page.waitFor(
    async () => (await inputValue(page)) === before,
    "没选就离开，输入框应该回到原来的值",
  );
});

test("清除钮：有值时才出现，点了清空", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--groups");
  const CLEAR = "#storybook-root button[aria-label=清除]";
  await page.waitVisible(CLEAR);
  await page.click(CLEAR);
  await page.waitFor(
    async () => (await inputValue(page)) === "",
    "点清除之后输入框应该是空的",
  );
  await page.waitGone(CLEAR, "没有值了，清除钮应该收起");
});

test("面板落在外框下方、左对齐、不比它窄", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--playground");
  await page.click(INPUT);
  await page.waitVisible(PANEL);
  const layout = await page.evaluate(() => {
    const box = document
      .querySelector("input[role=combobox]")!
      .closest("[data-variant]")!
      .getBoundingClientRect();
    const panel = document
      .querySelector("[role=listbox]")!
      .closest("[data-side]")!
      .getBoundingClientRect();
    return {
      below: panel.top >= box.bottom,
      aligned: Math.abs(panel.left - box.left) < 2,
      wide: panel.width >= box.width - 1,
    };
  });
  assert.deepEqual(layout, { below: true, aligned: true, wide: true });
});

test("多选：没打字直接选，面板不关，可以连着选", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--multiple");
  assert.deepEqual(await chips(page), ["北区七号站", "南岸二号站"]);

  await page.key("Tab");
  await page.key("ArrowDown");
  await page.waitVisible(PANEL);
  await page.key("ArrowDown");
  const first = await page.waitFor(() => highlighted(page), "没有高亮的选项");
  await page.key("Enter");
  await page.waitFor(
    async () => (await chips(page)).length === 3,
    "选中之后应该多一个小块",
  );
  await page.key("ArrowDown");
  await page.waitFor(
    async () => (await highlighted(page)) !== first,
    "高亮应该移到下一项",
  );
  await page.key("Enter");
  await page.waitFor(
    async () => (await chips(page)).length === 4,
    "接着再选一个，应该又多一个小块",
  );
  // 过一会儿再看：面板不是"正在关"，是真的还开着
  await page.pause(400);
  assert.ok(await page.visible(PANEL), "没打字直接选的时候不应该关面板");
});

test("多选：打了字再选，这一次搜索结束——文字清空、面板关上；退格删掉最后一个", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--multiple");

  await page.key("Tab");
  await page.type("东线一");
  await page.waitVisible(PANEL);
  await page.key("ArrowDown");
  await page.waitFor(
    async () => (await highlighted(page)) === "东线一号站",
    "应该高亮东线一号站",
  );
  await page.key("Enter");
  await page.waitFor(
    async () => (await chips(page)).length === 3,
    "选中之后应该多一个小块",
  );
  await page.waitGone(PANEL, "搜出来再选，面板应该关上");
  assert.equal(await inputValue(page), "", "选了之后输入的文字应该清空");
  await page.waitFocused(/^combobox:/, "焦点应该还在输入框里");

  // 接着打字，面板再打开
  await page.type("西坡");
  await page.waitVisible(PANEL, "继续打字应该再打开面板");
  // 多选时 Esc 关面板的同时把没选完的字清掉
  await page.key("Escape");
  await page.waitGone(PANEL);
  await page.waitFor(
    async () => (await inputValue(page)) === "",
    "Esc 之后没选完的字应该清掉",
  );
  await page.key("Backspace");
  await page.waitFor(
    async () => (await chips(page)).join() === "北区七号站,南岸二号站",
    "输入框空着时按退格应该删掉最后一个",
  );
});

test("多选：← 走到小块上，在小块上按退格删掉它", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--multiple");
  await page.key("Tab");
  await page.key("ArrowLeft");
  await page.waitFocused(/南岸二号站/, "← 应该走到最后一个小块上");
  await page.key("ArrowLeft");
  await page.waitFocused(/北区七号站/);
  await page.key("Backspace");
  await page.waitFor(
    async () => (await chips(page)).join() === "南岸二号站",
    "在小块上按退格应该删掉它",
  );
});

test("多选：小块多了外框长高，窄容器里不溢出", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--narrow");
  const box = await page.evaluate(() => {
    const frame = document
      .querySelector("input[role=combobox]")!
      .closest("[data-variant]")!;
    const outer = frame.getBoundingClientRect();
    const inside = [...frame.querySelectorAll("*")].every(
      (element) => element.getBoundingClientRect().right <= outer.right + 0.5,
    );
    return { height: outer.height, inside };
  });
  assert.ok(box.height > 60, "三个小块排不下一行，外框应该长高");
  assert.ok(box.inside, "小块不应该伸到外框外面");
});

test("两个主题：键盘移到当前项上，它的底色会变", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-combobox-组合框--groups", theme);
    await page.click(INPUT);
    await page.waitVisible(PANEL);
    const color = () =>
      page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector("[role=option][aria-selected=true]")!,
          ).backgroundColor,
      );
    const selected = () =>
      page.evaluate(() =>
        document
          .querySelector("[role=option][aria-selected=true]")!
          .hasAttribute("data-highlighted"),
      );
    // 把高亮从当前项上挪开，再挪回来
    await page.key("ArrowDown");
    await page.waitFor(async () => !(await selected()), "高亮应该离开当前项");
    const resting = await page.waitFor(color, "量不到当前项的底色");
    await page.key("ArrowUp");
    await page.waitFor(
      async () => (await selected()) && (await color()) !== resting,
      `${theme}：移到当前项上时底色应该和平时不一样`,
    );
    await page.key("Escape");
  }
});

test("远程检索：正在查找时面板里是一行状态，不说没有匹配；结果回来后换成选项", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--remote");
  const status = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[role=status]")]
        .map((element) => (element.textContent ?? "").trim())
        .filter(Boolean),
    );

  await page.click(INPUT);
  await page.type("s-0");
  await page.waitFor(
    async () => (await status()).includes("正在查找…"),
    "打字之后应该先出现正在查找",
  );
  assert.ok(
    !(await status()).includes("没有匹配的选项"),
    "查找中不应该说没有匹配",
  );

  await page.waitFor(
    async () =>
      (await options(page)).join() !== "" && (await status()).length === 0,
    "结果回来之后状态行应该消失、列出选项",
  );
  assert.ok(
    (await options(page)).every((label) => label.startsWith("南岸")),
    "按编号 s-0 回来的应该都是南岸的站",
  );
});

test("远程检索：选中的站不在后来的结果里，输入框里的名字也还在", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--remote");
  await page.click(INPUT);
  await page.type("s-03");
  await page.waitFor(
    async () => (await options(page)).join() === "南岸三号站",
    "按编号 s-03 应该只剩南岸三号站",
  );
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitGone(PANEL);
  assert.equal(await inputValue(page), "南岸三号站");

  // 再搜别的：这一批结果里没有南岸三号站了
  await page.evaluate(() =>
    document.querySelector<HTMLInputElement>("input[role=combobox]")!.select(),
  );
  await page.type("n-0");
  await page.waitFor(async () => {
    const found = await options(page);
    return found.length > 0 && found.every((label) => label.startsWith("北区"));
  }, "按编号 n-0 回来的应该都是北区的站");
  // 没选就离开：输入框回到原来的值——它的文字是组合框自己记着的
  await page.key("Escape");
  await page.waitGone(PANEL);
  await page.waitFor(
    async () => (await inputValue(page)) === "南岸三号站",
    "值对应的选项不在这一批里，输入框里的名字也应该还在",
  );
});

test("一直在查找的样子：只有状态行，没有选项也没有空说明", async () => {
  const { page } = storybook;
  await page.story("控件-combobox-组合框--loading");
  await page.waitFor(
    () =>
      page.evaluate(() =>
        [...document.querySelectorAll("[role=status]")].some(
          (element) =>
            element.textContent?.trim() === "正在查找…" &&
            element.getBoundingClientRect().height > 0,
        ),
      ),
    "应该有一行正在查找",
  );
  assert.deepEqual(await options(page), []);
  assert.equal(await emptyNote(page), false);
});
