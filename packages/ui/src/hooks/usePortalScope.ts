import { useCallback, useRef } from "react";

const opposite = (theme: "light" | "dark") =>
  theme === "dark" ? "light" : "dark";

type PortalScopeOptions = {
  /**
   * 浮层用和声明处相反的主题：亮色页面上是一块深色，暗色页面上是一块浅色
   * （文字提示）。里面的控件因此也按相反的底色取值。
   */
  invertTheme?: boolean;
};

/**
 * 浮层挂在 `<body>` 下，离开了声明它的那棵子树，拿不到局部容器上的
 * `data-theme` / `data-choice`。把 `anchorRef` 交给触发元素、`portalRef`
 * 交给浮层的容器：容器每次挂载时，从触发元素往上找最近的开关，抄到容器上。
 *
 * 最近的就是 `<html>` 时不抄——浮层本来就继承它，抄了反而会在切换主题后留下旧值。
 * 没有触发元素（纯受控的弹窗）时什么都不做，浮层跟随 `<html>`。
 *
 * 最近的是 `data-theme="inverse"`（反转块）时不能照抄：`inverse` 是相对的，
 * 到了 `<body>` 下它反的就成了页面。所以先算出它实际是亮还是暗，抄算出来的那个。
 */
export function usePortalScope({
  invertTheme = false,
}: PortalScopeOptions = {}) {
  const anchor = useRef<Element | null>(null);

  // 两个都是回调 ref：不管对方要的是哪种元素的 ref 都能接上
  const anchorRef = useCallback((node: Element | null) => {
    anchor.current = node;
  }, []);

  const portalRef = useCallback(
    (portal: HTMLElement | null) => {
      if (!portal) return;
      const root = document.documentElement;

      const themed =
        anchor.current?.closest<HTMLElement>("[data-theme]") ?? null;
      const inverted = themed?.dataset.theme === "inverse";
      // 反转块反的是谁：再往上找第一个写明亮 / 暗的容器
      let base = themed;
      while (base?.dataset.theme === "inverse") {
        base = base.parentElement?.closest<HTMLElement>("[data-theme]") ?? null;
      }
      // 没有任何地方写主题时，页面是默认的亮色
      const baseTheme =
        (base ?? root).dataset.theme === "dark" ? "dark" : "light";
      const theme = inverted ? opposite(baseTheme) : baseTheme;

      if (invertTheme) {
        portal.dataset.theme = opposite(theme);
      } else if (inverted || (themed && themed !== root)) {
        portal.dataset.theme = theme;
      }

      const choice = anchor.current?.closest<HTMLElement>("[data-choice]");
      if (choice && choice !== root) {
        portal.dataset.choice = choice.dataset.choice;
      }
    },
    [invertTheme],
  );

  return { anchorRef, portalRef };
}
