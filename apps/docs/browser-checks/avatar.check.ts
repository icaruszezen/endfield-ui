// 头像与头像切换：图加载出来、选中环、方向键换人、翻页钮到头禁用、放不下时选中的滚进来
import assert from "node:assert/strict";
import { test } from "node:test";
import { useStorybook, type Page } from "./lib/harness.ts";

const storybook = useStorybook();

const GROUP = "#storybook-root [role=radiogroup]";

const checked = (page: Page) =>
  page.evaluate(
    () =>
      document
        .querySelector("#storybook-root input[type=radio]:checked")
        ?.getAttribute("aria-label") ?? null,
  );

const buttons = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      [
        ...document.querySelectorAll<HTMLButtonElement>(
          "#storybook-root [role=radiogroup] > button",
        ),
      ].map((button) => [button.getAttribute("aria-label"), button.disabled]),
    ),
  );

test("头像：给了图就显示图；没有图、图加载失败时是名字的首字", async () => {
  const { page } = storybook;
  await page.story("控件-avatar-头像与头像切换--sizes");
  await page.waitFor(
    () =>
      page.evaluate(() => {
        const images = [
          ...document.querySelectorAll<HTMLImageElement>(
            "#storybook-root [role=img] img",
          ),
        ];
        return (
          images.length === 4 && images.every((image) => image.naturalWidth > 0)
        );
      }),
    "四个头像的图都应该加载出来",
  );
  assert.deepEqual(
    await page.evaluate(() =>
      [...document.querySelectorAll("#storybook-root [role=img]")].map(
        (avatar) => Math.round(avatar.getBoundingClientRect().width),
      ),
    ),
    [32, 40, 56, 80],
  );

  await page.story("控件-avatar-头像与头像切换--fallback");
  await page.waitFor(
    async () =>
      (await page.text("#storybook-root [role=img]")).join() === "陈,MK,加,",
    "没有图的显示首字，加载失败的也是；最后一个是图标",
  );
});

test("选中环：只有选中的头像有，里面有一圈行动色", async () => {
  const { page } = storybook;
  for (const theme of ["light", "dark"] as const) {
    await page.story("控件-avatar-头像与头像切换--selected", theme);
    const rings = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.color = "var(--ef-action)";
      document.querySelector("#storybook-root")!.append(probe);
      const action = getComputedStyle(probe).color;
      probe.remove();
      return [...document.querySelectorAll("#storybook-root [role=img]")].map(
        (avatar) => {
          const shadow = getComputedStyle(avatar).boxShadow;
          return shadow === "none" ? "none" : shadow.includes(action);
        },
      );
    });
    assert.deepEqual(rings, ["none", true, true], theme);
  }
});

test("头像切换：Tab 只停一次，方向键换人，下面的名字跟着换", async () => {
  const { page } = storybook;
  await page.story("控件-avatar-头像与头像切换--switcher");
  assert.equal(await checked(page), "林澈");
  const name = async () =>
    (await page.text("#storybook-root [aria-live] p"))[0] ?? "";

  await page.key("Tab");
  await page.waitFocused("input:林澈", "Tab 应该落在选中的那个头像上");
  await page.key("ArrowDown");
  await page.waitFor(
    async () => (await checked(page)) === "Mira Kessel",
    "↓ 应该换到下一个",
  );
  assert.match(await name(), /Mira Kessel/);
  await page.key("ArrowUp");
  await page.key("ArrowUp");
  await page.waitFor(
    async () => (await checked(page)) === "陈知远",
    "↑ 两次应该到第一个",
  );

  // Tab 离开：整个单选组只占一个停靠点
  await page.key("Tab");
  assert.ok(
    !(await page.focused()).startsWith("input:"),
    "再按 Tab 应该离开这一列头像",
  );
});

test("头像切换：翻页钮选上一个 / 下一个，到头时禁用", async () => {
  const { page } = storybook;
  await page.story("控件-avatar-头像与头像切换--switcher");
  assert.deepEqual(await buttons(page), { 上一个: false, 下一个: false });

  await page.click("text=上一个");
  await page.waitFor(
    async () => (await checked(page)) === "陈知远",
    "点上一个应该选到陈知远",
  );
  await page.waitFor(
    async () => (await buttons(page))["上一个"] === true,
    "到了第一个，上一个应该禁用",
  );

  for (const expected of ["林澈", "Mira Kessel", "苏禾"]) {
    await page.click("text=下一个");
    await page.waitFor(
      async () => (await checked(page)) === expected,
      `点下一个应该选到${expected}`,
    );
  }
  assert.deepEqual(await buttons(page), { 上一个: false, 下一个: true });
});

test("头像切换：选中的带环，其余的退后一档", async () => {
  const { page } = storybook;
  await page.story("控件-avatar-头像与头像切换--switcher");
  const looks = await page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root label")].map((label) => {
      const avatar = label.querySelector("[data-size]")!;
      const style = getComputedStyle(avatar);
      return {
        ring: style.boxShadow !== "none",
        opacity: Number(style.opacity),
      };
    }),
  );
  assert.deepEqual(
    looks.map((look) => look.ring),
    [false, true, false, false],
  );
  assert.equal(looks[1]!.opacity, 1);
  assert.ok(
    looks[0]!.opacity < 1 && looks[2]!.opacity < 1,
    "没选中的头像应该降了不透明度",
  );
});

test("头像切换：放不下时在两个翻页钮之间滚动，选中的那个整个滚进来", async () => {
  const { page } = storybook;
  await page.story("控件-avatar-头像与头像切换--switcher-scrolling");
  const state = () =>
    page.evaluate(() => {
      const group = document.querySelector(
        "#storybook-root [role=radiogroup]",
      )!;
      const scroller = group.children[1]!;
      const view = scroller.getBoundingClientRect();
      const current = scroller
        .querySelector("[data-current]")!
        .getBoundingClientRect();
      return {
        scrollable: scroller.scrollHeight > scroller.clientHeight + 1,
        scrolled: scroller.scrollTop,
        inside:
          current.top >= view.top - 0.5 && current.bottom <= view.bottom + 0.5,
        page: document.documentElement.scrollTop,
      };
    });
  assert.ok((await state()).scrollable, "六个头像在这个高度里应该放不下");

  for (let i = 0; i < 4; i++) await page.click("text=下一个");
  await page.waitFor(
    async () => (await checked(page)) === "唐砚",
    "点四次下一个应该选到最后一个",
  );
  const end = await page.waitFor(async () => {
    const found = await state();
    return found.inside && found.scrolled > 0 ? found : null;
  }, "选到最后一个，它应该整个滚进来");
  assert.equal(end.page, 0, "只滚这一列，不带着页面滚");
  assert.ok(await page.visible(GROUP));
});

test("头像切换（横排）：← → 换人", async () => {
  const { page } = storybook;
  await page.story("控件-avatar-头像与头像切换--switcher-horizontal");
  await page.key("Tab");
  await page.waitFocused("input:林澈");
  await page.key("ArrowRight");
  await page.waitFor(
    async () => (await checked(page)) === "Mira Kessel",
    "→ 应该换到下一个",
  );
  await page.key("ArrowLeft");
  await page.waitFor(
    async () => (await checked(page)) === "林澈",
    "← 应该换回来",
  );
  const row = await page.evaluate(() => {
    const labels = [...document.querySelectorAll("#storybook-root label")].map(
      (label) => label.getBoundingClientRect(),
    );
    return labels.every((rect) => Math.abs(rect.top - labels[0]!.top) < 1);
  });
  assert.ok(row, "横排时头像应该在同一行");
});
