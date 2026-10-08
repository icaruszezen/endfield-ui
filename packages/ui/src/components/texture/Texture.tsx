import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";

export type TextureVariant = "dots" | "grid" | "contour";

export type TextureProps = Omit<ComponentProps<"div">, "children"> & {
  /**
   * - `dots` 点阵，印刷网点：弹窗、卡片、面板的底，默认；
   * - `grid` 工程网格，图纸与坐标：图解、工作台的背景；
   * - `contour` 等高线，测绘与地形：偏在一角，被容器的边缘截断。
   */
  variant?: TextureVariant;
};

const variantClass: Record<TextureVariant, string> = {
  dots: "dot-grid",
  grid: "blueprint-grid",
  contour: "contour",
};

/**
 * 铺在内容之下的一层底纹，纯装饰。默认铺满最近的定位祖先：
 * 父容器要自己写 `relative`，需要裁切时再加 `overflow-clip`。
 * 一个视口选一种；文字下面垫一层实色，别让底纹穿过正文。
 */
export function Texture({
  variant = "dots",
  className,
  ...props
}: TextureProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-variant={variant}
      className={cn(decor, "absolute inset-0", variantClass[variant], className)}
    />
  );
}
