import { useCallback, useRef } from "react";

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

      const themed = anchor.current?.closest<HTMLElement>("[data-theme]");
      if (invertTheme) {
        // 没有任何地方写主题时，页面是默认的亮色
        const theme = (themed ?? root).dataset.theme;
        portal.dataset.theme = theme === "dark" ? "light" : "dark";
      } else if (themed && themed !== root) {
        portal.dataset.theme = themed.dataset.theme;
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
