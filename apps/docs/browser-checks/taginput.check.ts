// 标签输入：打字加、键盘删、重复时那一闪、粘贴、表单值、窄了换行
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const tags = (page: Page) => page.text("#storybook-root [data-tag]");

const waitTags = (page: Page, expected: string[], message: string) =>
  page.waitFor(
    async () => (await tags(page)).join("|") === expected.join("|"),
    message,
  );

const inputValue = (page: Page) =>
  page.evaluate(
    () =>
      document.querySelector<HTMLInputElement>(
        "#storybook-root input[type=text]",
      )!.value,
  );

test("打字加回车加一个；打逗号（半角、全角）也是；框里清空", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--playground");
  assert.deepEqual(await tags(page), ["北岭", "管廊"]);

  await page.key("Tab");
  await page.waitFocused("input:站点标签");
  await page.type("二号线");
  await page.key("Enter");
  await waitTags(page, ["北岭", "管廊", "二号线"], "回车应该加一个");
  assert.equal(await inputValue(page), "");

  await page.type("信标,");
  await waitTags(page, ["北岭", "管廊", "二号线", "信标"], "半角逗号应该提交");
  await page.type("滤芯，");
  await waitTags(
    page,
    ["北岭", "管廊", "二号线", "信标", "滤芯"],
    "全角逗号应该提交",
  );
  assert.equal(await inputValue(page), "");
});

test("键盘删：空着按 Backspace 删最后一个；← 走到小块上，Delete 删掉它，焦点落到旁边", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--narrow");
  const all = await tags(page);
  assert.equal(all.length, 4);

  await page.click("#storybook-root input[type=text]");
  await page.waitFocused("input:站点标签");
  await page.key("Backspace");
  await waitTags(page, all.slice(0, 3), "空着按 Backspace 应该删最后一个");
  await page.waitFocused("input:站点标签", "删完焦点应该还在输入框里");

  await page.key("ArrowLeft");
  await page.waitFocused("button:移除二号线", "← 应该走到最后一个小块上");
  await page.key("ArrowLeft");
  await page.waitFocused("button:移除输料管廊");
  await page.key("Delete");
  await waitTags(page, ["北岭", "二号线"], "Delete 应该删掉这个小块");
  await page.waitFocused("button:移除二号线", "焦点应该落到原来的下一个上");
  await page.key("ArrowRight");
  await page.waitFocused("input:站点标签", "→ 应该走回输入框");

  // 整个控件只占一个 Tab 停靠点
  assert.deepEqual(
    await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          "#storybook-root [data-tag] button",
        ),
      ].map((button) => button.tabIndex),
    ),
    [-1, -1],
  );
});

test("小块上的焦点环看得见", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--playground");
  await page.key("Tab");
  await page.key("ArrowLeft");
  await page.waitFocused("button:移除管廊");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }),
    "键盘走到的小块应该有焦点环",
  );
});

test("重复：不加，字留着，已有的那个小块闪一下反转填充（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-taginput-标签输入--limit", theme);
    await page.frames();
    const fill = () =>
      page.evaluate(() => {
        const chips = [
          ...document.querySelectorAll<HTMLElement>(
            "#storybook-root [data-tag]",
          ),
        ];
        return chips.map((chip) => ({
          flash: chip.hasAttribute("data-flash"),
          background: getComputedStyle(chip).backgroundColor,
        }));
      });
    const rest = (await fill())[0]!.background;

    await page.key("Tab");
    await page.type("滤芯");
    await page.key("Enter");
    // 一闪只有 400ms：等它出现，再等它颜色走到头
    const flashed = await page.waitFor(async () => {
      const [first, second] = await fill();
      return first!.flash && first!.background !== rest
        ? { first: first!, second: second! }
        : null;
    }, `${theme}：重复的那个小块应该闪一下`);
    assert.equal(flashed.second.flash, false, "另一个小块不该闪");
    assert.equal(await inputValue(page), "滤芯", "没加成的字应该留在框里");
    assert.deepEqual(await tags(page), ["滤芯", "电池"]);
    assert.equal(
      (await page.text("#storybook-root [role=status]"))[0],
      "// 滤芯：duplicate",
    );

    await page.waitFor(async () => {
      const [first] = await fill();
      return !first!.flash && first!.background === rest;
    }, `${theme}：闪完应该回到原来的底色`);
  }
});

test("上限：右端的计数跟着走，满了之后加不进去", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--limit");
  const count = async () =>
    (await page.text("#storybook-root [data-count]"))[0];
  assert.equal(await count(), "2 / 4");

  await page.key("Tab");
  await page.type("信标,测绘,");
  await page.waitFor(async () => (await count()) === "4 / 4", "计数应该到 4");
  await page.type("管廊");
  await page.key("Enter");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0] === "// 管廊：max",
    "满了之后应该加不进去",
  );
  assert.equal((await tags(page)).length, 4);
  assert.equal(await inputValue(page), "管廊");
});

test("自己把关：没过的不加，字段下面出错误说明；改对了就消失", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--validate");
  await page.key("Tab");
  await page.type("这个不行");
  await page.key("Enter");
  await page.waitVisible("#storybook-root [id$=error]", "应该出现错误说明");
  assert.deepEqual(await tags(page), ["N7"]);
  assert.equal(
    await page.evaluate(() =>
      document.activeElement!.getAttribute("aria-invalid"),
    ),
    "true",
  );

  for (let index = 0; index < 4; index += 1) await page.key("Backspace");
  await page.type("S2");
  await page.key("Enter");
  await waitTags(page, ["N7", "S2"], "合格的应该加进去");
  await page.waitGone("#storybook-root [id$=error]", "错误说明应该消失");
});

test("粘贴一串：按逗号和换行拆开", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--playground");
  await page.key("Tab");
  await page.waitFocused("input:站点标签");
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.setData("text/plain", "二号线,信标\n滤芯");
    document.activeElement!.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await waitTags(
    page,
    ["北岭", "管廊", "二号线", "信标", "滤芯"],
    "粘贴的一串应该拆成三个",
  );
});

test("离开输入框时没提交的字也加进去；值随表单提交", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--in-field");
  await page.click("#storybook-root input[type=text]");
  await page.waitFor(
    () =>
      page.evaluate(
        () =>
          document.activeElement ===
          document.querySelector("#storybook-root input[type=text]"),
      ),
    "点标签输入的框，焦点应该进去",
  );
  await page.type("二号线");
  await page.click("text=保存");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root output"))[0] ===
      "name=北区七号站&tags=北岭|管廊|二号线",
    "提交的值里应该有三个标签",
  );
});

test("点框里空着的地方，焦点进输入框；点叉删掉", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--playground");
  const point = await page.evaluate(() => {
    const box = document
      .querySelector("#storybook-root [data-variant]")!
      .getBoundingClientRect();
    // 靠右、靠下：小块和输入框都不在这儿
    return { x: box.right - 6, y: box.bottom - 4 };
  });
  await page.click(point);
  await page.waitFocused("input:站点标签", "点空白处焦点应该进输入框");

  await page.click("text=移除北岭");
  await waitTags(page, ["管廊"], "点叉应该删掉这个小块");
  await page.waitFocused("input:站点标签", "鼠标删完焦点应该回到输入框");
});

test("外框和输入框同一个样子：最小高度三档，小块多了换行、外框长高", async () => {
  const { page } = storybook;
  await page.story("控件-taginput-标签输入--sizes");
  assert.deepEqual(
    await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          "#storybook-root [data-variant]",
        ),
      ].map((box) => [
        box.offsetHeight,
        box.querySelector<HTMLElement>("[data-tag]")!.offsetHeight,
      ]),
    ),
    [
      [32, 20],
      [40, 24],
      [56, 32],
    ],
  );

  await page.story("控件-taginput-标签输入--narrow");
  const narrow = await page.evaluate(() => {
    const box = document.querySelector<HTMLElement>(
      "#storybook-root [data-variant]",
    )!;
    const chips = [...box.querySelectorAll<HTMLElement>("[data-tag]")];
    const long = chips.at(-1)!.querySelector("span")!;
    const count = box.querySelector<HTMLElement>("[data-count]")!;
    return {
      taller: box.offsetHeight > 40,
      wrapped: new Set(chips.map((chip) => chip.offsetTop)).size > 1,
      // 计数贴着最后一行，不是竖向居中
      countAtBottom:
        box.getBoundingClientRect().bottom -
          count.getBoundingClientRect().bottom <
        20,
      inside: chips.every(
        (chip) =>
          chip.getBoundingClientRect().right <=
          box.getBoundingClientRect().right,
      ),
      truncated: long.scrollWidth > long.clientWidth,
    };
  });
  assert.deepEqual(narrow, {
    taller: true,
    wrapped: true,
    countAtBottom: true,
    inside: true,
    truncated: true,
  });
});
