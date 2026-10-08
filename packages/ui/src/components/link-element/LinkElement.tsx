import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps, ReactElement } from "react";
import { defined } from "../../lib/defined";

/** 用来代替 `<a>` 的元素，通常是路由库的链接组件：`<Link to="/archive" />` */
export type LinkRender = ReactElement<Record<string, unknown>>;

export type LinkElementProps = ComponentProps<"a"> & {
  render?: LinkRender;
};

/**
 * 各控件"链接形态"里的那个 `<a>`。不对外导出。
 *
 * 传了 `render` 就把控件算好的类名、状态属性和事件合并到那个元素上，
 * 由它来渲染：类名拼在一起，事件两边都触发，其余属性以那个元素自己写的为准。
 */
export function LinkElement({ render, ref, ...props }: LinkElementProps) {
  return useRender({
    render,
    ref,
    props: render ? defined(props) : props,
    defaultTagName: "a",
  });
}
