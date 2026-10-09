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
            .textContent!.includes("档案"),
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
        .textContent!.includes("档案 · 站点"),
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

test("调度台：按发车日期筛选", async () => {
  const { page } = storybook;
  await page.story("示例-调度台--page");
  const dates = () =>
    page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root tbody tr")].map(
        (row) => row.children[7]!.textContent,
      ),
    );
  assert.ok(new Set(await dates()).size > 1, "一开始各天的批次都有");

  await page.click("#storybook-root button[aria-haspopup=dialog]");
  await page.waitVisible("[role=dialog]");
  await page.click('[role=dialog] [data-date="2026-10-06"]');
  await page.waitGone("[role=dialog]");
  await page.waitFor(async () => {
    const shown = await dates();
    return shown.length > 0 && shown.every((date) => date === "10.06");
  }, "选了 10 月 6 日，剩下的行都应该是这一天发车");
  assert.match(
    (await page.text("#storybook-root main [role=status]"))[0]!,
    /10\.06 发车/,
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
