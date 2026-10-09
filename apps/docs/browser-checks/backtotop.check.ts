// 回到顶部：滚过一段才出现、没出现时聚焦不了、点了回到顶、焦点交还给页面的头上
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const BUTTON = "#storybook-root button[aria-label^=回到]";

const state = (page: Page) =>
  page.evaluate((css) => {
    const button = document.querySelector<HTMLElement>(css)!;
    const style = getComputedStyle(button);
    return {
      shown: style.visibility === "visible" && style.opacity === "1",
      hidden: style.visibility === "hidden",
      scrollY: Math.round(window.scrollY),
    };
  }, BUTTON);

const scrollPage = (page: Page, top: number) =>
  page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);

test("整页：没滚时看不见，也聚焦不了；滚过四百像素才出现，滚回来又消失", async () => {
  const { page } = storybook;
  await page.story("控件-backtotop-回到顶部--page");
  await page.waitFor(
    async () => (await state(page)).hidden,
    "没滚的时候应该看不见",
  );
  const focusable = await page.evaluate((css) => {
    const button = document.querySelector<HTMLElement>(css)!;
    button.focus();
    return document.activeElement === button;
  }, BUTTON);
  assert.equal(focusable, false, "没出现的时候不应该能被聚焦");

  await scrollPage(page, 300);
  await page.pause(300);
  assert.ok((await state(page)).hidden, "只滚了 300px，还不该出现");

  await scrollPage(page, 900);
  await page.waitFor(
    async () => (await state(page)).shown,
    "滚过 400px 应该出现",
  );

  await scrollPage(page, 0);
  await page.waitFor(
    async () => (await state(page)).hidden,
    "滚回顶部应该消失",
  );
});

test("整页：钉在视口右下角，离边 16px", async () => {
  const { page } = storybook;
  await page.story("控件-backtotop-回到顶部--page");
  await scrollPage(page, 900);
  await page.waitFor(async () => (await state(page)).shown, "应该出现");
  const place = await page.evaluate((css) => {
    const rect = document.querySelector(css)!.getBoundingClientRect();
    const view = document.documentElement;
    return {
      right: Math.round(view.clientWidth - rect.right),
      bottom: Math.round(view.clientHeight - rect.bottom),
      size: [rect.width, rect.height],
    };
  }, BUTTON);
  assert.deepEqual(place, { right: 16, bottom: 16, size: [48, 48] });
});

test("整页：点了回到顶部，焦点交还给页面，下一次 Tab 落在第一个链接上", async () => {
  const { page } = storybook;
  await page.story("控件-backtotop-回到顶部--page");
  await scrollPage(page, 900);
  await page.waitFor(async () => (await state(page)).shown, "应该出现");

  await page.click(BUTTON);
  await page.waitFor(
    async () => (await state(page)).scrollY === 0,
    "点了应该回到顶部",
  );
  await page.waitFor(
    async () => (await state(page)).hidden,
    "回到顶部之后它应该消失",
  );
  assert.equal(await page.focused(), "(body)", "焦点应该交给了页面");

  await page.key("Tab");
  await page.waitFocused(
    "a:第 1 节的原始记录",
    "下一次 Tab 应该从页面的头上开始",
  );
  assert.equal(
    await page.evaluate(() => document.body.hasAttribute("tabindex")),
    false,
    "焦点走了之后，临时加在 body 上的 tabindex 应该收回来",
  );
});

test("整页：键盘走到它、回车；页面上不留一圈围住整页的焦点环", async () => {
  const { page } = storybook;
  await page.story("控件-backtotop-回到顶部--page");
  await scrollPage(page, 900);
  await page.waitFor(async () => (await state(page)).shown, "应该出现");

  // 它排在正文最后一个链接的后面
  await page.evaluate(() => {
    const links = document.querySelectorAll<HTMLElement>("#storybook-root a");
    links[links.length - 1]!.focus({ preventScroll: true });
  });
  await page.key("Tab");
  await page.waitFocused("button:回到顶部");
  await page.waitFor(
    () =>
      page.evaluate((css) => {
        const style = getComputedStyle(document.querySelector(css)!);
        return style.outlineStyle === "solid" && style.outlineWidth === "2px";
      }, BUTTON),
    "键盘聚焦时应该有焦点环",
  );

  await page.key("Enter");
  await page.waitFor(
    async () => (await state(page)).scrollY === 0,
    "回车应该回到顶部",
  );
  await page.frames();
  const body = await page.evaluate(() => ({
    focused: document.activeElement === document.body,
    outline: getComputedStyle(document.body).outlineStyle,
  }));
  assert.deepEqual(body, { focused: true, outline: "none" });

  await page.key("Tab");
  await page.waitFocused("a:第 1 节的原始记录");
});

// 无头浏览器不做平滑滚动的动画（要了平滑也是一步到位），所以看的是它要的是哪一种
test("整页：没开「减少动态效果」时要的是平滑滚动，开了就直接跳", async () => {
  const { page } = storybook;
  const asked = async () => {
    await page.story("控件-backtotop-回到顶部--page");
    await scrollPage(page, 1200);
    await page.waitFor(async () => (await state(page)).shown, "应该出现");
    await page.evaluate(() => {
      const original = window.scrollTo.bind(window);
      const calls: unknown[] = [];
      Object.assign(window, { scrollCalls: calls });
      window.scrollTo = (...args: unknown[]) => {
        calls.push(args[0]);
        return (original as (...all: unknown[]) => void)(...args);
      };
    });
    await page.click(BUTTON);
    await page.waitFor(
      async () => (await state(page)).scrollY === 0,
      "点了应该回到顶部",
    );
    return page.evaluate(
      () => (window as unknown as { scrollCalls: unknown[] }).scrollCalls,
    );
  };

  assert.deepEqual(await asked(), [{ top: 0, behavior: "instant" }]);
  await page.setReducedMotion(false);
  try {
    assert.deepEqual(await asked(), [{ top: 0, behavior: "smooth" }]);
  } finally {
    await page.setReducedMotion(true);
  }
});

test("悬停变信号黄；亮暗两套下平时的底色都和页面拉得开", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-backtotop-回到顶部--page", theme);
    await scrollPage(page, 900);
    await page.waitFor(async () => (await state(page)).shown, "应该出现");
    await page.frames();

    const colors = () =>
      page.evaluate((css) => {
        const probe = (value: string) => {
          const element = document.createElement("i");
          element.style.backgroundColor = value;
          document.body.append(element);
          const color = getComputedStyle(element).backgroundColor;
          element.remove();
          return color;
        };
        return {
          button: getComputedStyle(document.querySelector(css)!)
            .backgroundColor,
          action: probe("var(--ef-action)"),
          inverse: probe("var(--ef-surface-inverse)"),
          surface: probe("var(--ef-surface)"),
        };
      }, BUTTON);

    const rest = await colors();
    assert.equal(rest.button, rest.inverse, `${theme}：平时是反转填充`);
    assert.notEqual(rest.button, rest.surface, `${theme}：不能和页面同色`);

    await page.moveTo(BUTTON);
    await page.waitFor(async () => {
      const now = await colors();
      return now.button === now.action;
    }, `${theme}：悬停应该变成信号黄`);
    // 把指针挪开，免得影响下一轮
    await page.moveTo({ x: 5, y: 5 });
  }
});

test("滚动容器里：看的是容器的滚动，回的是容器的顶，焦点交给容器", async () => {
  const { page } = storybook;
  await page.story("控件-backtotop-回到顶部--in-container");
  const inner = () =>
    page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>(
        "#storybook-root .overflow-y-auto",
      )!;
      const button = scroller.parentElement!.querySelector("button")!;
      const style = getComputedStyle(button);
      const box = scroller.parentElement!.getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      return {
        shown: style.visibility === "visible" && style.opacity === "1",
        top: Math.round(scroller.scrollTop),
        focused: document.activeElement === scroller,
        // 位置是相对外框的，不是相对视口
        right: Math.round(box.right - rect.right),
        bottom: Math.round(box.bottom - rect.bottom),
        position: style.position,
      };
    });

  // 页面滚了不算（这一页本来也滚不动），容器滚了才算
  assert.equal((await inner()).shown, false);
  await page.evaluate(() => {
    document.querySelector("#storybook-root .overflow-y-auto")!.scrollTop = 300;
  });
  const shown = await page.waitFor(async () => {
    const now = await inner();
    return now.shown ? now : null;
  }, "容器滚过阈值应该出现");
  assert.equal(shown.position, "absolute");
  // 外框有 1px 的边线
  assert.deepEqual([shown.right, shown.bottom], [13, 13]);

  await page.click("#storybook-root button[aria-label=回到这一栏的顶部]");
  const after = await page.waitFor(async () => {
    const now = await inner();
    return now.top === 0 && !now.shown ? now : null;
  }, "点了应该回到容器的顶部，然后消失");
  assert.ok(after.focused, "焦点应该交给了滚动容器");

  await page.key("Tab");
  await page.waitFocused(
    "a:第 1 节的原始记录",
    "下一次 Tab 进容器里的第一个链接",
  );
  assert.equal(
    await page.evaluate(() =>
      document
        .querySelector("#storybook-root .overflow-y-auto")!
        .hasAttribute("tabindex"),
    ),
    false,
    "临时加在容器上的 tabindex 应该收回来",
  );
});
