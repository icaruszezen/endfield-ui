import type { ComponentProps, ReactNode } from "react";

export type IconProps = Omit<ComponentProps<"svg">, "children"> & {
  /** 显示尺寸，默认 24。线宽随尺寸等比缩放 */
  size?: number | string;
};

/**
 * 按图标规范生成组件：24 网格、2px 描边、平头端点、尖角拐角、颜色继承。
 * 默认对辅助技术隐藏；单独承担含义时由使用方传 `aria-label` 并去掉 `aria-hidden`。
 */
export function createIcon(displayName: string, content: ReactNode) {
  function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="butt"
        strokeLinejoin="miter"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {content}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}
