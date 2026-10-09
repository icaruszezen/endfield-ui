// 几个示例页里各种控件配合起来的流程
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook({ width: 1280, height: 900 });

const toastTexts = (page: Page) =>
  page.text(
    "[role=region] [role=dialog] p, [role=region] [role=alertdialog] p",
  );

const waitToast = (page: Page, message: string) =>
  page.waitFor(async () => (await toastTexts(page))[0], message);

const count = (page: Page, selector: string) =>
  page.evaluate((css) => document.querySelectorAll(css).length, selector);

const comboValues = (page: Page) => page.text("[role=combobox]");

test("仓库页：销毁先过确认弹窗，完成后出一条能撤销的轻提示", async () => {
  const { page } = storybook;
  await page.story("示例-仓库页--page");
  const before = await count(page, "[data-rarity]");

  await page.click("text=销毁所选");
  await page.waitVisible("[role=alertdialog]");
  await page.waitFocused("button:取消", "焦点应该先落在取消上");
  const described = await page.evaluate(() => {
    const dialog = document.querySelector("[role=alertdialog]")!;
    const text = (attribute: string) =>
      document.getElementById(dialog.getAttribute(attribute) ?? "")
        ?.textContent ?? "";
    return [text("aria-labelledby"), text("aria-describedby")];
  });
  assert.ok(
    described.every(Boolean),
    "确认弹窗要有标题和说明，并且都关联给读屏",
  );

  await page.key("Tab");
  await page.key("Enter");
  await page.waitGone("[role=alertdialog]");
  await waitToast(page, "销毁后应该出一条轻提示");
  assert.ok(
    (await count(page, "[data-rarity]")) < before,
    "销毁后物品格应该变少",
  );
  assert.equal(
    await count(page, "[data-rarity][data-selected]"),
    1,
    "选中应该移到相邻的一格上",
  );

  await page.click("text=撤销");
  await page.waitFor(
    async () => (await count(page, "[data-rarity]")) === before,
    "撤销后物品格应该恢复",
  );
});

test("仓库页：锁定按钮带文字提示，并关联成补充说明", async () => {
  const { page } = storybook;
  await page.story("示例-仓库页--page");
  await page.moveTo("text=锁定");
  await page.waitVisible("[data-side][data-open]", "悬停后提示没有出现");

  assert.ok(
    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find(
        (candidate) => candidate.textContent?.trim() === "锁定",
      )!;
      return document.getElementById(
        button.getAttribute("aria-describedby") ?? "",
      )?.textContent;
    }),
    "提示的内容应该通过 aria-describedby 关联给按钮",
  );
});

test("仓库页：收支表里行首的圆可以关注一项", async () => {
  const { page } = storybook;
  await page.story("示例-仓库页--page");
  const pressed = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("[role=table] button")].map((button) =>
        button.getAttribute("aria-pressed"),
      ),
    );
  assert.deepEqual(await pressed(), ["true", "false", "false"]);
  await page.click("text=关注高能燃料");
  await page.waitFor(
    async () => (await pressed()).join() === "true,false,true",
    "点了之后这一项应该是已关注",
  );
});

test("仓库页（并排）：暗色那一半里打开的弹窗也是暗色", async () => {
  const { page } = storybook;
  await page.story("示例-仓库页--page", "both");
  await page.click("[data-theme=dark] button[data-variant=danger]");
  await page.waitVisible("[role=alertdialog]");
  assert.equal(
    await page.evaluate(
      () =>
        document
          .querySelector("[role=alertdialog]")!
          .parentElement!.closest<HTMLElement>("[data-theme]")?.dataset.theme,
    ),
    "dark",
  );
});

test("设置页：没填必填项时就地报错、不出轻提示；填好后保存出轻提示", async () => {
  const { page } = storybook;
  await page.story("示例-设置页--page");

  await page.click("button[type=submit]");
  await page.waitVisible("[role=alert]", "没填代号时应该就地报错");
  assert.deepEqual(await toastTexts(page), []);

  await page.click("#settings-codename");
  await page.type("seven");

  const initial = await comboValues(page);
  await page.evaluate(() =>
    document.querySelectorAll<HTMLElement>("[role=combobox]")[1]!.focus(),
  );
  await page.key("Enter");
  await page.waitVisible("[role=listbox]");
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitGone("[role=listbox]");
  const changed = await comboValues(page);
  assert.equal(changed[0], initial[0], "没动的那个下拉不应该变");
  assert.notEqual(changed[1], initial[1], "选了之后触发器的文字应该变");

  const submitted = await page.evaluate(() => {
    const data = new FormData(document.querySelector("form")!);
    return [data.get("region"), data.get("cadence")];
  });
  assert.ok(submitted.every(Boolean), "两个下拉的值都应该随表单提交");

  // 多选的那个字段：再选一项，每个值各提交一份
  await page.click("text=通知渠道");
  await page.waitVisible("[role=listbox][aria-multiselectable=true]");
  await page.click("[role=option][aria-selected=false]");
  await page.key("Escape");
  await page.waitGone("[role=listbox]");
  assert.equal(
    await page.evaluate(
      () =>
        new FormData(document.querySelector("form")!).getAll("channels").length,
    ),
    3,
    "多选的三个值应该各提交一份",
  );

  // 组合框的那个字段：按编号找到一个站，值随表单提交
  await page.click("form button[aria-label=清除]");
  await page.click("input[role=combobox]");
  await page.type("s-03");
  await page.waitFor(
    async () =>
      (await page.text("[role=listbox] [role=option]")).join() === "南岸三号站",
    "按编号 s-03 应该只剩南岸三号站",
  );
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitGone("[role=listbox]");
  assert.equal(
    await page.evaluate(() =>
      new FormData(document.querySelector("form")!).get("station"),
    ),
    "s3",
    "组合框选中的值应该随表单提交",
  );

  await page.click("button[type=submit]");
  await waitToast(page, "保存成功后应该出一条轻提示");
});

test("列表页：排序用下拉，更多操作是菜单", async () => {
  const { page } = storybook;
  await page.story("示例-列表页--page");

  const firstTitle = () =>
    page.evaluate(() =>
      document.querySelector("main h3, main a")?.textContent?.trim(),
    );
  const before = await firstTitle();
  await page.click("[role=combobox]");
  await page.waitVisible("[role=listbox]");
  // 面板出现和焦点进面板不是同一刻：机器忙的时候按键会先到，落在触发器上
  await page.waitFocused(/^option:/, "打开后焦点应该进到选项里");
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitFor(
    async () => (await firstTitle()) !== before,
    "换了排序方式后第一条应该变",
  );

  await page.click("text=更多操作");
  await page.waitVisible("[role=menu]");
  await page.click("text=复制链接");
  await page.waitGone("[role=menu]");
  await waitToast(page, "菜单里的操作应该出一条轻提示");
});

test("列表页：菜单里的复选项切换视图而不关菜单；导出在子菜单里", async () => {
  const { page } = storybook;
  await page.story("示例-列表页--page");
  const listShown = () => page.visible("main ul[aria-label=档案]");
  assert.equal(await listShown(), false, "默认是网格视图");

  await page.click("text=更多操作");
  await page.waitVisible("[role=menu]");
  await page.click("[role=menuitemcheckbox]");
  await page.waitFor(listShown, "勾上列表视图之后应该换成列表");
  assert.ok(await page.visible("[role=menu]"), "勾选之后菜单不应该关");
  // 页面上原来的那个开关是同一个状态
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector<HTMLInputElement>(
          "#storybook-root input[role=switch]",
        )?.checked,
    ),
    true,
  );

  await page.moveTo("[role=menuitem][aria-haspopup]");
  await page.waitFor(
    () =>
      page.evaluate(
        () => document.querySelectorAll("[role=menu]").length === 2,
      ),
    "指针停在导出为这一行上应该打开子菜单",
  );
  await page.click("text=纯文本");
  await page.waitGone("[role=menu]");
  assert.match(
    await waitToast(page, "导出后应该出一条轻提示"),
    /导出为纯文本$/,
  );
});

test("列表页：页面窄的时候类别筛选收进抽屉", async () => {
  const { page } = storybook;
  const shown = () =>
    page.evaluate(() => {
      const button = (matches: (text: string) => boolean) =>
        [...document.querySelectorAll("#storybook-root button")].some(
          (candidate) =>
            matches(candidate.textContent?.trim() ?? "") &&
            candidate.getBoundingClientRect().width > 0,
        );
      return {
        chips: button((text) => text === "新闻"),
        filterButton: button((text) => text.startsWith("筛选")),
      };
    });

  await page.story("示例-列表页--page");
  assert.deepEqual(await shown(), { chips: true, filterButton: false });

  await page.setSize(420, 900);
  try {
    await page.story("示例-列表页--page");
    assert.deepEqual(await shown(), { chips: false, filterButton: true });

    await page.click("text=筛选");
    await page.waitVisible("[role=dialog]");
    // 进场是一段平移，等它停在右边缘上
    await page.waitFor(
      () =>
        page.evaluate(() => {
          const rect = document
            .querySelector("[role=dialog]")!
            .getBoundingClientRect();
          return rect.left >= 0 && Math.abs(rect.right - innerWidth) < 1;
        }),
      "抽屉应该贴着右边缘、整个在视口里",
    );

    await page.click("[role=dialog] button[aria-pressed=false]");
    await page.click("text=完成");
    await page.waitGone("[role=dialog]");
    await page.waitFor(
      async () =>
        (await page.text("#storybook-root button")).some(
          (text) => text.startsWith("筛选") && text !== "筛选",
        ),
      "选了类别之后，筛选按钮上应该标出来",
    );
  } finally {
    await page.setSize(1280, 900);
  }
});

const visibleIn = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const element = document.querySelector(css);
    return !!element && element.getBoundingClientRect().width > 0;
  }, selector);

const RAIL = "#storybook-root nav[aria-label=主导航]";
const BAR = "#storybook-root header";

test("调度台：宽屏是侧轨，窄屏换成顶栏和全屏菜单；栏目是同一份状态", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  assert.ok(await visibleIn(page, RAIL), "1280px 宽应该是侧轨");
  assert.ok(!(await visibleIn(page, BAR)), "1280px 宽不应该有顶栏");
  assert.deepEqual(await page.text(`${RAIL} [aria-current=page]`), ["调度"]);

  await page.setSize(500, 900);
  try {
    await page.waitFor(
      async () =>
        (await visibleIn(page, BAR)) && !(await visibleIn(page, RAIL)),
      "500px 宽应该换成顶栏，侧轨收掉",
    );

    await page.click("button[aria-label=打开菜单]");
    await page.waitVisible("[role=dialog]");
    assert.deepEqual(await page.text("[role=dialog] [aria-current=page]"), [
      "调度",
    ]);
    await page.click("[role=dialog] li:nth-child(4) button");
    await page.waitGone("[role=dialog]", "点了栏目之后菜单应该关上");
    await page.waitFor(
      () =>
        page.evaluate(() =>
          document
            .querySelector("#storybook-root main")!
            .textContent.includes("档案"),
        ),
      "主体应该换成档案这一栏",
    );
  } finally {
    await page.setSize(1280, 900);
  }

  // 回到宽屏：侧轨上的当前项跟着变了。全屏菜单里选的是"档案 · 人员"，
  // 它在侧轨上是"档案"这个二级里的一项——二级原来收着，现在自己展开了
  await page.waitFor(
    async () =>
      (await page.text(`${RAIL} [aria-current=page]`)).join() === "人员",
    "窄屏上选的栏目，回到宽屏应该还是它，而且它所在的二级展开了",
  );
});

test("调度台：侧轨的二级点开，选里面的一项", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  const parent = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root nav button")]
        .find((button) => button.textContent?.trim() === "档案")!
        .getAttribute("aria-expanded"),
    );
  assert.equal(await parent(), "false", "当前栏目是调度，档案应该收着");

  await page.click("text=档案");
  await page.waitFor(async () => (await parent()) === "true", "点档案应该展开");
  await page.click("text=站点");
  await page.waitFor(
    async () =>
      (await page.text(`${RAIL} [aria-current=page]`)).join() === "站点",
    "点站点，它应该成为当前项",
  );
  assert.ok(
    await page.evaluate(() =>
      document
        .querySelector("#storybook-root main")!
        .textContent.includes("档案 · 站点"),
    ),
    "主体应该换成档案 · 站点",
  );
});

test("调度台：行上点右键，标记到站；和行尾的按钮是同一组操作", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  const ROW = "#storybook-root tbody tr:nth-child(1)";
  const status = () =>
    page.evaluate(
      (css) => document.querySelector(css)!.children[3]!.textContent,
      ROW,
    );
  assert.equal(await status(), "已延误");

  await page.click(`${ROW} td:nth-child(2)`, { button: "right" });
  await page.waitVisible("[role=menu]");
  assert.deepEqual(await page.text("[role=menu] [role=menuitem]"), [
    "复制链接",
    "打印单据",
    "标记到站",
  ]);
  await page.waitFocused(/^menu:/);
  await page.key("End");
  await page.waitFocused("menuitem:标记到站");
  await page.key("Enter");
  await page.waitGone("[role=menu]");
  await page.waitFor(
    async () => (await status()) === "已到站",
    "这一行应该变成已到站",
  );
  await waitToast(page, "TR-2041 已标记为到站");

  // 已经到站的行：菜单里这一项是禁用的
  await page.click(`${ROW} td:nth-child(2)`, { button: "right" });
  await page.waitVisible("[role=menu]");
  assert.equal(
    await page.evaluate(() =>
      [...document.querySelectorAll("[role=menu] [role=menuitem]")]
        .find((item) => item.textContent === "标记到站")!
        .getAttribute("aria-disabled"),
    ),
    "true",
  );
});

test("调度台：按发车日期筛选一段", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  const dates = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root tbody tr")].map(
        (row) => row.children[7]!.textContent,
      ),
    );
  assert.ok(new Set(await dates()).size > 3, "一开始各天的批次都有");

  await page.click("#storybook-root button[aria-haspopup=dialog]");
  await page.waitVisible("[role=dialog]");
  // 点两下：第一下面板不关
  await page.click('[role=dialog] [data-date="2026-10-06"]');
  await page.waitVisible("[role=dialog] [data-range-start]");
  await page.click('[role=dialog] [data-date="2026-10-08"]');
  await page.waitGone("[role=dialog]");
  await page.waitFor(async () => {
    const shown = await dates();
    return (
      shown.length === 6 &&
      shown.every((date) => ["10.06", "10.07", "10.08"].includes(date ?? "")) &&
      new Set(shown).size === 3
    );
  }, "选了 6 日到 8 日：剩下的六行都在这三天里，两头都算");
  assert.match(
    (await page.text("#storybook-root main [role=status]"))[0]!,
    /10\.06 至 10\.08 发车/,
  );

  // 清除：面板里的"清除"
  await page.click("#storybook-root button[aria-haspopup=dialog]");
  await page.waitVisible("[role=dialog]");
  await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[role=dialog] button")]
      .find((button) => button.textContent === "清除")!
      .click(),
  );
  await page.waitFor(
    async () => (await dates()).length === 8,
    "清除之后回到一页八行",
  );
});

test("调度台：组合框按站点筛选，表头排序，勾选之后批量标记", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  const rows = () => count(page, "#storybook-root tbody tr");
  const status = async () =>
    (await page.text("#storybook-root main [role=status]"))[0] ?? "";
  assert.equal(await rows(), 8, "一页八行");
  assert.match(await status(), /共 16 个批次/);

  // 筛选：按编号找到北区七号站
  await page.click("input[role=combobox]");
  await page.type("n-07");
  await page.waitFor(
    async () =>
      (await page.text("[role=listbox] [role=option]")).join() === "北区七号站",
    "按编号 n-07 应该只剩北区七号站",
  );
  await page.key("ArrowDown");
  await page.key("Enter");
  await page.waitFor(
    async () => /北区七号站/.test(await status()),
    "选了站点之后应该按它筛选",
  );
  assert.ok((await rows()) < 8, "筛选之后行数应该变少");
  assert.ok(
    (
      await page.evaluate(() =>
        [...document.querySelectorAll("#storybook-root tbody tr")].map(
          (row) => row.children[2]!.textContent,
        ),
      )
    ).every((text) => text === "北区七号站"),
    "剩下的行都应该是北区七号站",
  );

  await page.click("#storybook-root button[aria-label=清除]");
  await page.waitFor(async () => (await rows()) === 8, "清除之后回到八行");

  // 排序：按件数升序
  await page.click("#storybook-root thead th:nth-child(6) button");
  await page.waitFor(
    async () =>
      (await page.evaluate(() =>
        document
          .querySelector("#storybook-root thead th:nth-child(6)")!
          .getAttribute("aria-sort"),
      )) === "ascending",
    "点件数应该按它升序",
  );
  const numbers = await page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root tbody tr")].map((row) =>
      Number(row.children[5]!.textContent),
    ),
  );
  assert.deepEqual(
    numbers,
    [...numbers].sort((a, b) => a - b),
  );

  // 勾选：全选本页，批量标记
  await page.evaluate(() => {
    // 工具条下面那个"全选本页"
    const all = [
      ...document.querySelectorAll<HTMLInputElement>(
        "#storybook-root main input[type=checkbox]",
      ),
    ].find((input) => input.closest("label")?.textContent === "全选本页")!;
    if (!all.checked) all.click();
  });
  await page.waitFor(
    async () =>
      (await count(page, "#storybook-root tbody tr[aria-selected=true]")) === 8,
    "全选之后八行都应该是选中的",
  );
  await page.click("text=标记到站 · 8");
  await waitToast(page, "批量标记之后应该出一条轻提示");
  await page.waitFor(
    async () =>
      (await count(page, "#storybook-root tbody tr[aria-selected=true]")) === 0,
    "标记之后选中应该清空",
  );
  assert.ok(
    (
      await page.evaluate(() =>
        [...document.querySelectorAll("#storybook-root tbody tr")].map(
          (row) => row.children[3]!.textContent,
        ),
      )
    ).every((text) => text === "已到站"),
    "这一页的批次都应该变成已到站",
  );
});

test("仓库页：物品格矩阵只占一个 Tab 停靠点，方向键换格子", async () => {
  const { page } = storybook;
  await page.story("示例-仓库页--page");
  const stops = await page.evaluate(() => {
    const grid = document.querySelector(
      "#storybook-root [role=group][aria-label=物资]",
    )!;
    return [...grid.querySelectorAll("[data-slot-control]")].filter(
      (control) => control.getAttribute("tabindex") === "0",
    ).length;
  });
  assert.equal(stops, 1, "矩阵里应该只有一格能被 Tab 停到");

  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>(
        "#storybook-root [role=group][aria-label=物资] [tabindex='0']",
      )!
      .focus(),
  );
  const name = () =>
    page.evaluate(
      () =>
        document.activeElement!.querySelector(".sr-only")?.textContent ?? "",
    );
  const before = await name();
  await page.key("ArrowLeft");
  await page.waitFor(
    async () => (await name()) !== before,
    "← 应该把焦点移到左边一格",
  );
});

test("设置页：滑块的值随表单提交；高级设置收在折叠面板里", async () => {
  const { page } = storybook;
  await page.story("示例-设置页--page");
  const volume = () =>
    page.evaluate(() =>
      new FormData(document.querySelector("form")!).get("volume"),
    );
  assert.equal(await volume(), "60");
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>("#storybook-root input[type=range]")!
      .focus(),
  );
  await page.key("ArrowRight");
  await page.waitFor(async () => (await volume()) === "65", "→ 加一步是 65");

  const expanded = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root h3 button")].map(
        (button) => button.getAttribute("aria-expanded"),
      ),
    );
  assert.deepEqual(await expanded(), ["false", "false", "false"]);
  await page.click("text=本地缓存128 MB");
  await page.waitFor(
    async () => (await expanded()).join() === "false,true,false",
    "点本地缓存应该展开它",
  );
  assert.ok(
    await page.evaluate(() =>
      [
        ...document.querySelectorAll("#storybook-root [role=region] button"),
      ].some((button) => button.textContent === "清除缓存"),
    ),
    "展开之后里面的按钮在页面里",
  );
});

test("内容页：轮播翻页换说明，头像切换换人，排期在自己里面滚", async () => {
  const { page } = storybook;
  await page.story("示例-内容页--page");

  const caption = async () =>
    (
      await page.text(
        "#storybook-root [aria-roledescription=轮播] [aria-live] p",
      )
    )[0];
  assert.equal(await caption(), "线路测绘");
  await page.click("text=下一张");
  await page.waitFor(
    async () => (await caption()) === "物资调度",
    "点下一张，说明应该换成第二张的",
  );

  const name = async () =>
    (await page.text("#storybook-root [role=radiogroup] + [aria-live] p"))[0] ??
    "";
  assert.match(await name(), /陈知远/);
  await page.evaluate(() =>
    document
      .querySelector<HTMLElement>(
        "#storybook-root [role=radiogroup] input:checked",
      )!
      .focus(),
  );
  await page.key("ArrowDown");
  await page.waitFor(
    async () => /林澈/.test(await name()),
    "↓ 换到下一个人，右边的介绍跟着换",
  );

  const schedule = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(
      "#storybook-root [style*='--schedule-days']",
    )!;
    return {
      items: root.querySelectorAll("li").length,
      scrolls: root.scrollWidth > root.clientWidth + 1,
      pageScrolls:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    };
  });
  // 内容区最宽 768px，三十一天放不下：排期在自己里面横向滚动
  assert.deepEqual(schedule, { items: 5, scrolls: true, pageScrolls: false });
});

test("列表页：影像类目的卡片封面上带播放记号，别的不带", async () => {
  const { page } = storybook;
  await page.story("示例-列表页--page");
  const cards = await page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root main article")].map(
      (card) => ({
        video: /影像/.test(card.querySelector("p")?.textContent ?? ""),
        mark: card.querySelector("span[aria-hidden=true][data-size]") !== null,
        spoken: card.querySelector("a")!.textContent.startsWith("视频："),
        links: card.querySelectorAll("a, button").length,
      }),
    ),
  );
  assert.ok(cards.length > 0, "网格里应该有卡片");
  assert.ok(
    cards.some((card) => card.video),
    "这一页里应该有影像类目的卡片",
  );
  for (const card of cards) {
    assert.equal(card.mark, card.video, "播放记号只出现在影像的卡片上");
    assert.equal(card.spoken, card.video, "读屏听到的「视频：」也是");
    assert.equal(card.links, 1, "整卡仍然只有一个可点击元素");
  }
});

test("内容页：滚下去之后右下角出现回到顶部，点了回到顶，下一次 Tab 从头开始", async () => {
  const { page } = storybook;
  await page.story("示例-内容页--page");
  const BUTTON = "#storybook-root button[aria-label=回到顶部]";
  const state = () =>
    page.evaluate((css) => {
      const button = document.querySelector<HTMLElement>(css)!;
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return {
        shown: style.visibility === "visible" && style.opacity === "1",
        position: style.position,
        // 贴着视口的下沿
        fromBottom: Math.round(innerHeight - rect.bottom),
        scrollY: Math.round(scrollY),
      };
    }, BUTTON);

  assert.equal((await state()).shown, false, "没滚的时候不出现");
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: "instant" }));
  const shown = await page.waitFor(async () => {
    const now = await state();
    return now.shown ? now : null;
  }, "滚过 400px 应该出现");
  assert.equal(shown.position, "sticky");
  assert.equal(shown.fromBottom, 16, "应该贴着视口的下沿，离边 16px");

  await page.click(BUTTON);
  await page.waitFor(async () => {
    const now = await state();
    return now.scrollY === 0 && !now.shown;
  }, "点了应该回到顶部，然后消失");
  assert.equal(await page.focused(), "(body)", "焦点应该交给了页面");
  await page.key("Tab");
  await page.waitFor(
    async () => (await page.focused()) !== "(body)",
    "下一次 Tab 应该落在页面里的第一个控件上",
  );
  assert.equal(
    await page.evaluate(() => {
      const first = document.querySelector(
        "#storybook-root a, #storybook-root button, #storybook-root [tabindex='0']",
      );
      return document.activeElement === first;
    }),
    true,
    "落在的是页面里排在最前面的那个控件",
  );
});

test("设置页：步骤条说走到了第二步；分段选择的值随表单提交", async () => {
  const { page } = storybook;
  await page.story("示例-设置页--page");
  const steps = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "#storybook-root ol[aria-label=建站流程] > li",
      ),
    ].map((step) => ({
      status: step.getAttribute("data-status"),
      current: step.getAttribute("aria-current"),
    })),
  );
  assert.deepEqual(steps, [
    { status: "done", current: null },
    { status: "current", current: "step" },
    { status: "upcoming", current: null },
    { status: "upcoming", current: null },
  ]);

  const clock = () =>
    page.evaluate(() =>
      new FormData(document.querySelector("form")!).get("clock"),
    );
  assert.equal(await clock(), "24");
  await page.click("text=12 小时");
  await page.waitFor(async () => (await clock()) === "12", "点 12 小时");
  await page.key("ArrowLeft");
  await page.waitFor(async () => (await clock()) === "24", "← 回到 24 小时");
});

test("调度台：一行展开看装车明细；工具栏换行高、全部展开，导出在菜单里", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  const details = () => count(page, "#storybook-root tbody tr[data-detail]");
  const rowHeight = () =>
    page.evaluate(
      () =>
        document.querySelector<HTMLElement>(
          "#storybook-root tbody tr td:nth-child(2)",
        )!.offsetHeight,
    );
  const pressed = (name: string) =>
    page.evaluate(
      (label) =>
        document
          .querySelector(
            `#storybook-root [role=toolbar] [aria-label="${label}"]`,
          )!
          .getAttribute("aria-pressed"),
      name,
    );
  assert.equal(await details(), 0, "一开始都是收起的");

  // 展开第一行：明细出现在它下面；批次还是八行
  await page.click("text=TR-2041 的明细");
  await page.waitFor(async () => (await details()) === 1, "应该展开一行明细");
  assert.match(
    (await page.text("#storybook-root tbody tr[data-detail]"))[0]!,
    /装箱/,
  );
  assert.equal(
    await count(page, "#storybook-root tbody tr:not([data-detail])"),
    8,
  );

  // 工具栏整条只占一个 Tab 停靠点
  assert.equal(
    await page.evaluate(
      () =>
        [
          ...document.querySelectorAll<HTMLElement>(
            "#storybook-root [role=toolbar] button",
          ),
        ].filter((button) => button.tabIndex === 0).length,
    ),
    1,
  );

  // 行高：紧凑。再点一次按下的那个，它不弹起来（行高是二选一）
  const before = await rowHeight();
  await page.click("text=紧凑行高");
  await page.waitFor(
    async () => (await rowHeight()) < before,
    "紧凑之后行应该变矮",
  );
  await page.click("text=紧凑行高");
  await page.pause(300);
  assert.deepEqual(
    [await pressed("紧凑行高"), await pressed("标准行高")],
    ["true", "false"],
  );

  // 全部展开、全部收起：钮上的字跟着换
  await page.click("text=全部展开");
  await page.waitFor(async () => (await details()) === 8, "八行都应该展开");
  await page.click("text=全部收起");
  await page.waitFor(async () => (await details()) === 0, "应该全部收起");

  // 导出是一个菜单：没勾选时"导出选中的"是禁用的
  await page.click("text=导出");
  await page.waitVisible("[role=menu]");
  assert.deepEqual(await page.text("[role=menu] [role=menuitem]"), [
    "导出本页",
    "导出选中的",
  ]);
  assert.equal(
    await page.evaluate(() =>
      [...document.querySelectorAll("[role=menu] [role=menuitem]")]
        .at(-1)!
        .getAttribute("aria-disabled"),
    ),
    "true",
  );
  await page.click("text=导出本页");
  await page.waitGone("[role=menu]");
  await waitToast(page, "导出之后应该出一条轻提示");
});

test("设置页：标签输入加一个，附件拖进来列出来；两样都在表单里", async () => {
  const { page } = storybook;
  await page.story("示例-设置页--page");
  const values = () =>
    page.evaluate(() => {
      const data = new FormData(document.querySelector("form")!);
      return {
        tags: data.getAll("tags"),
        files: data
          .getAll("attachments")
          .filter((entry) => entry instanceof File && entry.size > 0)
          .map((entry) => (entry as File).name),
      };
    });
  assert.deepEqual(await values(), { tags: ["北岭", "管廊"], files: [] });

  await page.click("#storybook-root [data-variant]:has([data-tag]) input");
  await page.type("二号线,");
  await page.waitFor(
    // oxlint-disable-next-line typescript/no-base-to-string -- 这个字段填的是文字，取出来的都是字符串
    async () => (await values()).tags.join() === "北岭,管廊,二号线",
    "打逗号应该加一个标签",
  );

  // 合成一个带文件的拖放：一个合格的、一个类型不对的
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(
      new File([new Uint8Array(2048)], "交接单.pdf", {
        type: "application/pdf",
      }),
    );
    data.items.add(
      new File([new Uint8Array(64)], "工具.exe", {
        type: "application/x-msdownload",
      }),
    );
    document.querySelector("#storybook-root [data-dropzone]")!.dispatchEvent(
      new DragEvent("drop", {
        dataTransfer: data,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await page.waitFor(
    async () => (await values()).files.join() === "交接单.pdf",
    "合格的文件应该在表单里",
  );
  assert.equal(
    (await page.text("#storybook-root [data-rejections]"))[0],
    "1 个文件没有加进来：工具.exe 类型不对",
  );
});

test("内容页：够宽时右边有页内目录，滚到哪亮到哪；并排时两份都窄，不显示", async () => {
  const { page } = storybook;
  await page.story("示例-内容页--page");
  const NAV = "#storybook-root nav:has(a[data-toc-section])";
  const current = () =>
    page.evaluate(
      (css) =>
        document.querySelector(`${css} a[aria-current=location]`)
          ?.textContent ?? null,
      NAV,
    );
  const sectionTop = (title: string) =>
    page.evaluate(
      ({ css, text }) => {
        const link = [
          ...document.querySelectorAll<HTMLElement>(`${css} a`),
        ].find((node) => node.textContent === text)!;
        return document
          .getElementById(link.dataset.tocSection!)!
          .getBoundingClientRect().top;
      },
      { css: NAV, text: title },
    );

  await page.waitVisible(NAV, "单独一份、够宽的时候应该有目录");
  assert.deepEqual(await page.text(`${NAV} a`), [
    "最新情报",
    "日常作业",
    "队员",
    "本月排期",
    "站点档案",
  ]);

  // 滚到"队员"那一节贴着视口的上沿
  const top = await sectionTop("队员");
  await page.evaluate((delta) => window.scrollBy(0, delta), top);
  await page.waitFor(
    async () => (await current()) === "队员",
    "滚到队员那一节，目录里它应该亮",
  );
  // 目录是 sticky 的：还在视口里
  assert.ok(
    await page.evaluate((css) => {
      const rect = document.querySelector(css)!.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    }, NAV),
    "目录应该跟着留在视口里",
  );

  // 点一项：跳过去，它亮。（页面上还有一个同名的轮播，所以按选择器点目录里的那个）
  await page.click(`${NAV} a[data-toc-section$=fieldwork]`);
  await page.waitFor(
    async () => (await current()) === "日常作业",
    "点了日常作业，它应该亮",
  );
  await page.waitFor(
    async () => Math.abs(await sectionTop("日常作业")) < 2,
    "页面应该跳到这一节",
  );

  // 并排：每一份都不够宽，目录不显示
  await page.story("示例-内容页--page", "both");
  assert.deepEqual(
    await page.evaluate(
      (css) =>
        [...document.querySelectorAll(css)].map(
          (nav) => getComputedStyle(nav).display,
        ),
      NAV,
    ),
    ["none", "none"],
  );
});

test("设置页：页头里是一级标题和面包屑；交接口令打六位，随表单走", async () => {
  const { page } = storybook;
  await page.story("示例-设置页--page");
  const header = await page.evaluate(() => {
    const element = document.querySelector("#storybook-root header")!;
    return {
      heading: element.querySelector("h1")?.textContent,
      breadcrumb: element.querySelector("nav")?.getAttribute("aria-label"),
      // 右边那几样读数在标题的同一行
      sameRow:
        Math.abs(
          element.querySelector("[data-actions]")!.getBoundingClientRect().top -
            element.querySelector("h1")!.getBoundingClientRect().top,
        ) < 1,
    };
  });
  assert.deepEqual(header, {
    heading: "站点设置",
    breadcrumb: "面包屑",
    sameRow: true,
  });

  const code = () =>
    page.evaluate(() =>
      new FormData(document.querySelector("form")!).get("handover"),
    );
  assert.equal(await code(), "", "一开始口令是空的");
  // 点标签，焦点落在第一格
  await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("#storybook-root label")]
      .find((label) => label.textContent === "交接口令")!
      .scrollIntoView({ block: "center" }),
  );
  await page.click(
    await page.evaluate(() => {
      const rect = [
        ...document.querySelectorAll<HTMLElement>("#storybook-root label"),
      ]
        .find((label) => label.textContent === "交接口令")!
        .getBoundingClientRect();
      return { x: rect.left + 8, y: rect.top + rect.height / 2 };
    }),
  );
  await page.waitFocused(/^input:/, "点标签焦点应该落在第一格");
  await page.type("204157");
  await page.waitFor(
    async () => (await code()) === "204157",
    "六位口令应该随表单提交",
  );
});

test("列表页：页头报出共多少条；右栏的日程限高，在自己的滚动区里滚", async () => {
  const { page } = storybook;
  await page.story("示例-列表页--page");
  const header = await page.evaluate(() => {
    const element = document.querySelector("#storybook-root header")!;
    return [
      element.querySelector("h1")?.textContent,
      element.querySelector("p")?.textContent,
    ];
  });
  assert.deepEqual(header, ["档案", "// ARCHIVE　共 28 条"]);

  const AREA = "#storybook-root [data-scroll-area]";
  const read = () =>
    page.evaluate((css) => {
      const root = document.querySelector<HTMLElement>(css)!;
      const viewport = root.firstElementChild as HTMLElement;
      return {
        role: viewport.getAttribute("role"),
        name: viewport.getAttribute("aria-label"),
        height: root.getBoundingClientRect().height,
        overflows: viewport.scrollHeight > viewport.clientHeight + 1,
        bars: root.querySelectorAll(":scope > [aria-hidden][data-orientation]")
          .length,
        scrollTop: viewport.scrollTop,
        // 八条日程都在里面
        items: viewport.querySelectorAll("li").length,
      };
    }, AREA);
  // 八条日程每条至少两行字，怎么都比 224px 高（和字体无关）
  await page.waitFor(
    async () => (await read()).bars === 1,
    "日程比给它的高度长，应该有一条滚动条",
  );
  const found = await read();
  assert.deepEqual(
    {
      role: found.role,
      name: found.name,
      overflows: found.overflows,
      items: found.items,
    },
    { role: "region", name: "日程", overflows: true, items: 8 },
  );
  assert.ok(Math.abs(found.height - 224) < 1, "滚动区顶到 224px 的上限");

  await page.evaluate((css) => {
    document.querySelector(css)!.firstElementChild!.scrollTop = 120;
  }, AREA);
  await page.waitFor(
    async () => (await read()).scrollTop === 120,
    "日程应该能在自己里面滚",
  );
});

test("调度台：目的站是链接，悬停出一张站点的悬浮卡，出在右边不盖住下面几行", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  // 第三列是目的站；第一列的批次号也是链接，不是它
  const LINK = "#storybook-root tbody tr:not([data-detail]) td:nth-child(3) a";
  const first = await page.evaluate((css) => {
    const link = document.querySelector<HTMLAnchorElement>(css)!;
    link.scrollIntoView({ block: "center" });
    const rect = link.getBoundingClientRect();
    return {
      text: link.textContent ?? "",
      hash: link.getAttribute("href"),
      point: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      right: rect.right,
    };
  }, LINK);
  assert.match(first.hash ?? "", /^#[NSEW]-\d\d$/, "链接指向这个站的编号");

  await page.moveTo(first.point);
  await page.waitFor(
    () =>
      page.evaluate(
        (name) =>
          [...document.querySelectorAll("[data-hover-card]")].some((card) =>
            (card.textContent ?? "").includes(name),
          ),
        first.text,
      ),
    "悬停在目的站上应该出一张写着站名的卡片",
  );
  const card = await page.evaluate((css) => {
    const element = document.querySelector("[data-hover-card]")!;
    const rect = element.getBoundingClientRect();
    // 这一列里别的链接有没有被卡片盖住
    const covered = [...document.querySelectorAll(css)].filter((link) => {
      const box = link.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      return hit !== null && element.contains(hit);
    }).length;
    return {
      left: rect.left,
      covered,
      progress: element.querySelector("[role=progressbar]") !== null,
      text: element.textContent ?? "",
    };
  }, LINK);
  assert.ok(card.left >= first.right, "卡片应该出在链接的右边");
  assert.equal(card.covered, 0, "卡片不应该盖住这一列里的链接");
  assert.equal(card.progress, true, "卡片里有仓容的进度条");
  assert.match(card.text, /编号 [NSEW]-\d\d/);

  await page.moveTo({ x: 5, y: 5 });
  await page.waitFor(
    async () => (await count(page, "[data-hover-card]")) === 0,
    "指针移开之后卡片应该关",
  );
});

test("内容页：站点档案里的现场照片，点一张放大，翻一张，关了回到那张缩略图", async () => {
  const { page } = storybook;
  await page.story("示例-内容页--page");
  const THUMBS = '#storybook-root ul[aria-label="现场照片"] button';
  const VIEWER = "[data-image-viewer]";
  assert.equal(await count(page, THUMBS), 5);

  await page.click(
    await page.evaluate((css) => {
      const button = document.querySelectorAll<HTMLElement>(css)[1]!;
      button.scrollIntoView({ block: "center" });
      const rect = button.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, THUMBS),
  );
  await page.waitVisible(VIEWER, "点缩略图应该打开大图层");
  const counter = () =>
    page.evaluate(
      (css) => document.querySelector(`${css} [data-count]`)?.textContent,
      VIEWER,
    );
  await page.waitFor(async () => (await counter()) === "2 / 5", "开在第二张");
  // 按键之前等焦点进到这一层
  await page.waitFor(
    () =>
      page.evaluate(
        (css) => document.activeElement === document.querySelector(css),
        VIEWER,
      ),
    "打开时焦点应该在大图层上",
  );
  await page.key("ArrowRight");
  await page.waitFor(async () => (await counter()) === "3 / 5", "→ 到第三张");

  await page.key("Escape");
  await page.waitGone(VIEWER, "Esc 应该关");
  await page.waitFocused(
    "button:查看大图：第三岩层营地全景",
    "焦点应该回到第三张的缩略图",
  );
});
