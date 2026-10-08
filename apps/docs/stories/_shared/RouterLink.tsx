import type { ComponentProps } from "react";

/**
 * 假的路由链接，演示 `render` 用：真实项目里换成路由库的 `Link`。
 * 它自己的属性是 `to`，地址由它算出来；收到的其余属性原样落在 `<a>` 上。
 */
export function RouterLink({
  to,
  ...props
}: ComponentProps<"a"> & { to: string }) {
  return <a data-router-link="" {...props} href={`#${to}`} />;
}
