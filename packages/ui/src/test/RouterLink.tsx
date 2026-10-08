import type { ComponentProps } from "react";

/**
 * 测试里代替路由库的链接组件：自己的属性是 `to`，地址由它算出来，
 * 收到的其余属性原样落在 `<a>` 上。
 */
export function RouterLink({
  to,
  ...props
}: ComponentProps<"a"> & { to: string }) {
  return <a data-router-link="" href={`/app${to}`} {...props} />;
}
