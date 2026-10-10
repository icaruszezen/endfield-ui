// 页内目录：滚到哪一节哪一项亮、滚到底亮最后一项、点一项之后它亮着、目录自己能滚时跟着走
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const NAV = "#storybook-root nav";
const SCROLLER = "#storybook-root [role=region]";

/** 现在亮着的那一项的文字；一项都不亮是 null */
const current = (page: Page) =>
  page.evaluate(
    (css) =>
      document.querySelector(`${css} a[aria-current=location]`)?.textContent ??
      null,
    NAV,
  );

const waitCurrent = (page: Page, expected: string | null, message: string) =>
  page.waitFor(async () => (await current(page)) === expected, message);

/** 把正文那个滚动容器滚到某一节的顶边贴着容器上沿（差几像素） */
const scrollToSection = (page: Page, title: string, delta = 0) =>
  page.evaluate(
    ({ css, text, extra }) => {
      const scroller = document.querySelector<HTMLElement>(css)!;
      const heading = [...scroller.querySelectorAll("header")].find(
        (node) => node.textContent === text,
      )!;
      scroller.scrollTop +=
        heading.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        extra;
    },
    { css: SCROLLER, text: title, extra: delta },
  );

test("滚到哪一节，哪一项亮；差一点没到的不算；滚到底亮最后一项", async () => {
  const { page } = storybook;
  await page.story("控件-toc-页内目录--playground");
  // 第一节的顶边一开始离容器上沿还有一段内边距：哪一项都不亮
  await waitCurrent(page, null, "一开始哪一项都不该亮");

  await scrollToSection(page, "最新情报");
  await waitCurrent(page, "最新情报", "第一节到了上沿应该亮");
  await scrollToSection(page, "队员", -6);
  await waitCurrent(
    page,
    "日常作业",
    "第三节差一点没到上沿，亮的应该还是第二节",
  );
  await scrollToSection(page, "队员");
  await waitCurrent(page, "队员", "第三节到了上沿应该亮");

  // 滚到底：最后一节很短，顶边到不了上沿，也该亮
  const reached = await page.evaluate((css) => {
    const scroller = document.querySelector<HTMLElement>(css)!;
    scroller.scrollTop = scroller.scrollHeight;
    const last = [...scroller.querySelectorAll("header")].at(-1)!;
    return (
      last.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    );
  }, SCROLLER);
  assert.ok(reached > 10, "这个 story 里最后一节的顶边应该到不了上沿");
  await waitCurrent(page, "站点档案", "滚到底应该亮最后一项");
  // 状态行是 story 收到 onActiveChange 之后再渲染的，比目录自己亮起来晚一拍：等它
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=status]"))[0]?.endsWith(
        "station",
      ) ?? false,
    "onActiveChange 应该报了最后一节",
  );

  // 往回滚到头：又是一项都不亮
  await page.evaluate((css) => {
    document.querySelector<HTMLElement>(css)!.scrollTop = 0;
  }, SCROLLER);
  await waitCurrent(page, null, "滚回头上应该一项都不亮");
});

test("当前项：引线上一段 3px 的粗条，字是墨色，不加粗；整列的高度不跟着变（亮暗两套）", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-toc-页内目录--playground", theme);
    const measure = () =>
      page.evaluate((css) => {
        const nav = document.querySelector<HTMLElement>(css)!;
        const color = (variable: string) => {
          const probe = document.createElement("i");
          probe.style.color = `var(${variable})`;
          nav.append(probe);
          const value = getComputedStyle(probe).color;
          probe.remove();
          return value;
        };
        const ink = color("--ef-ink");
        const line = color("--ef-line");
        const links = [...nav.querySelectorAll("a")];
        const active = nav.querySelector("a[aria-current]");
        const bar = active ? getComputedStyle(active, "::before") : null;
        const guide = getComputedStyle(nav.querySelector("ul")!, "::before");
        return {
          height: nav.offsetHeight,
          weights: [
            ...new Set(links.map((a) => getComputedStyle(a).fontWeight)),
          ],
          activeInk: active ? getComputedStyle(active).color === ink : null,
          bar: bar ? [bar.width, bar.backgroundColor === ink] : null,
          guide: [guide.width, guide.backgroundColor === line],
          restInk: links
            .filter((a) => a !== active)
            .some((a) => getComputedStyle(a).color === ink),
        };
      }, NAV);

    await waitCurrent(page, null, "一开始哪一项都不该亮");
    // 暗色主题是载入之后过渡过去的：等引线的颜色到位再量
    await page.waitFor(
      async () => (await measure()).guide[1] === true,
      `${theme}：引线应该是 line 的颜色`,
    );
    const before = await measure();
    assert.deepEqual(before.guide, ["1px", true], `${theme}：引线`);
    assert.equal(before.restInk, false, `${theme}：平时的项不该是墨色`);

    await scrollToSection(page, "日常作业");
    await waitCurrent(page, "日常作业", "第二节到了上沿应该亮");
    await page.waitFor(
      async () => (await measure()).activeInk === true,
      `${theme}：当前项的字应该是墨色`,
    );
    const after = await measure();
    assert.deepEqual(after.bar, ["3px", true], `${theme}：粗条`);
    assert.equal(after.weights.length, 1, `${theme}：当前项不该换字重`);
    assert.equal(after.height, before.height, `${theme}：整列的高度变了`);
    assert.equal(after.restInk, false);
  }
});

test("点一项：正文滚过去，这一项立刻亮，并且保持到自己再滚为止", async () => {
  const { page } = storybook;
  await page.story("控件-toc-页内目录--playground");
  const scrollTop = () =>
    page.evaluate((css) => document.querySelector(css)!.scrollTop, SCROLLER);

  // 倒数第二节：正文滚不到让它贴着上沿（下面不够长），按位置算亮的会是别的
  await page.click("text=本月排期");
  await waitCurrent(page, "本月排期", "点了之后这一项应该立刻亮");
  await page.waitFor(async () => (await scrollTop()) > 0, "正文应该滚过去了");

  // 等这一次滚动停下：还是它
  await page.pause(500);
  assert.equal(await current(page), "本月排期", "滚动停下之后亮的不该换成别的");

  // 自己再滚一下：回到按位置算
  await scrollToSection(page, "日常作业");
  await waitCurrent(page, "日常作业", "自己再滚之后应该按位置算");
});

test("键盘：每一项都是链接，Tab 走得到，回车跳过去；焦点环画在里面", async () => {
  const { page } = storybook;
  await page.story("控件-toc-页内目录--playground");
  // 第一个停靠点是能滚动的正文
  await page.key("Tab");
  await page.waitFocused("region:正文");
  await page.key("Tab");
  await page.waitFocused("a:最新情报");
  await page.key("Tab");
  await page.waitFocused("a:日常作业");
  const ring = await page.waitFor(async () => {
    const found = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement!);
      return {
        style: style.outlineStyle,
        width: style.outlineWidth,
        offset: style.outlineOffset,
      };
    });
    return found.style === "solid" ? found : null;
  }, "键盘聚焦的项应该有焦点环");
  assert.deepEqual(ring, { style: "solid", width: "2px", offset: "-2px" });

  await page.key("Enter");
  await waitCurrent(page, "日常作业", "回车应该跳到这一节");
  assert.ok(
    (await page.evaluate(
      (css) => document.querySelector(css)!.scrollTop,
      SCROLLER,
    )) > 0,
    "正文应该滚过去了",
  );
});

test("两级：层级只是缩进，引线不跟着缩进；名称来自小标", async () => {
  const { page } = storybook;
  await page.story("控件-toc-页内目录--levels");
  const found = await page.evaluate((css) => {
    const nav = document.querySelector<HTMLElement>(css)!;
    const title = nav.querySelector("p")!;
    return {
      labelledBy: nav.getAttribute("aria-labelledby") === title.id,
      title: title.textContent,
      lists: nav.querySelectorAll("ul").length,
      padding: [...nav.querySelectorAll("a")].map(
        (link) => getComputedStyle(link).paddingLeft,
      ),
      lefts: new Set(
        [...nav.querySelectorAll("a")].map((link) =>
          Math.round(link.getBoundingClientRect().left),
        ),
      ).size,
    };
  }, NAV);
  assert.deepEqual(found, {
    labelledBy: true,
    title: "// 本页",
    lists: 1,
    padding: ["16px", "16px", "28px", "28px", "16px"],
    lefts: 1,
  });
});

test("目录自己能滚：当前项保持在看得见的范围里，页面不跟着动", async () => {
  const { page } = storybook;
  await page.story("控件-toc-页内目录--own-scroll");
  const state = () =>
    page.evaluate((css) => {
      const nav = document.querySelector<HTMLElement>(css)!;
      const active = nav.querySelector("a[aria-current]");
      const box = nav.getBoundingClientRect();
      const rect = active?.getBoundingClientRect();
      return {
        scrollable: nav.scrollHeight > nav.clientHeight,
        navScroll: nav.scrollTop,
        pageScroll: window.scrollY,
        active: active?.textContent ?? null,
        visible: rect
          ? rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1
          : null,
      };
    }, NAV);

  assert.equal((await state()).scrollable, true, "这个 story 里目录应该能滚");
  await scrollToSection(page, "第 9 天的记录");
  await waitCurrent(page, "第 9 天的记录", "第九节到了上沿应该亮");
  const down = await page.waitFor(async () => {
    const found = await state();
    return found.visible ? found : null;
  }, "当前项应该被带进目录看得见的范围");
  assert.ok(down.navScroll > 0, "目录自己应该滚下去了");
  assert.equal(down.pageScroll, 0, "页面不该跟着动");

  await scrollToSection(page, "第 2 天的记录");
  await waitCurrent(page, "第 2 天的记录", "第二节到了上沿应该亮");
  const up = await page.waitFor(async () => {
    const found = await state();
    return found.visible ? found : null;
  }, "往回滚时当前项也应该被带回来");
  assert.ok(up.navScroll < down.navScroll, "目录应该往回滚了");
});

test("整页：看的是页面的滚动；吸顶的页头让出 offset，点目录跳过去标题不被压住", async () => {
  const { page } = storybook;
  // 视口矮一点：CI 上没有中文字体、正文折的行少，页面比本机短，得留够能滚的距离
  await page.setSize(1000, 360);
  await page.story("控件-toc-页内目录--page");
  await waitCurrent(page, null, "一开始哪一项都不该亮");

  const headingTop = (title: string) =>
    page.evaluate(
      (text) =>
        [...document.querySelectorAll("#storybook-root section > header")]
          .find((node) => node.textContent === text)!
          .getBoundingClientRect().top,
      title,
    );

  // 第二节的顶边到了页头下面（offset 是 80）：亮
  await page.evaluate(() => {
    const heading = [
      ...document.querySelectorAll("#storybook-root section > header"),
    ].find((node) => node.textContent === "日常作业")!;
    window.scrollBy(0, heading.getBoundingClientRect().top - 80);
  });
  await waitCurrent(page, "日常作业", "第二节到了页头下面应该亮");

  // 目录是 sticky 的：还在视口里，贴在页头下面
  const navTop = await page.evaluate(
    (css) => document.querySelector(css)!.getBoundingClientRect().top,
    NAV,
  );
  assert.equal(Math.round(navTop), 80, "目录应该贴在页头下面");

  // 点第三项：标题停在页头下面，没有被压住
  await page.click("text=队员");
  await waitCurrent(page, "队员", "点了之后这一项应该亮");
  await page.waitFor(
    async () => Math.abs((await headingTop("队员")) - 80) < 2,
    "标题应该停在页头下面（scroll-mt 和 offset 一样大）",
  );

  // 滚到底：最后一项
  await page.pause(400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await waitCurrent(page, "站点档案", "滚到底应该亮最后一项");
  await page.setSize(1280, 800);
});

test("长标题折行，不截断", async () => {
  const { page } = storybook;
  await page.story("控件-toc-页内目录--long-titles");
  const found = await page.evaluate((css) => {
    const nav = document.querySelector<HTMLElement>(css)!;
    // 把目录压窄，让标题放不下
    nav.style.width = "80px";
    const links = [...nav.querySelectorAll<HTMLElement>("a")];
    const link = links[0]!;
    const style = getComputedStyle(link);
    const oneLine =
      parseFloat(style.lineHeight) +
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom);

    // 这条标题一行写完要多宽：不同的机器上字体不一样（CI 上没有中文字体），
    // 所以不假定它一定放不下，量出来再说
    link.style.whiteSpace = "nowrap";
    const natural = link.scrollWidth;
    link.style.whiteSpace = "";
    const available = link.clientWidth;
    const lines = Math.round(
      (link.offsetHeight - (oneLine - parseFloat(style.lineHeight))) /
        parseFloat(style.lineHeight),
    );

    return {
      // 放不下就得折成多行；量到的数一起带出来，没过的时候看得到
      wraps: natural <= available || lines > 1,
      measured: { natural, available, lines },
      // 不是靠截断收住的
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      clipped: links.some((item) => item.scrollWidth > item.clientWidth + 1),
      inside: links.every(
        (item) =>
          item.getBoundingClientRect().right <=
          nav.getBoundingClientRect().right + 0.5,
      ),
    };
  }, NAV);
  assert.deepEqual(
    { ...found, measured: undefined },
    {
      wraps: true,
      measured: undefined,
      whiteSpace: "normal",
      textOverflow: "clip",
      clipped: false,
      inside: true,
    },
    `量到的：${JSON.stringify(found.measured)}`,
  );
});
