import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";

export type HatchDensity = "fine" | "mid" | "bold";

export type HatchProps = Omit<ComponentProps<"div">, "children"> & {
  /**
   * - `bold` 粗而淡的斜带（墨色 5%），跟随主题。条带状的表面：工具条、标题栏，默认；
   * - `mid` 比底色亮一档的斜带，压在深色控件上，不随主题变；
   * - `fine` 很细的墨色斜带，填未探索的区域、需要"留空"的格子。
   */
  density?: HatchDensity;
};

const densityClass: Record<HatchDensity, string> = {
  bold: "hatch",
  mid: "hatch hatch-mid",
  fine: "hatch hatch-fine",
};

/**
 * 一块 45° 斜纹，纯装饰。尺寸、位置、底色都由 `className` 给。
 * 把它限制在条带和控件上：不要铺满整个页面，也不要压在正文下面。
 */
export function Hatch({ density = "bold", className, ...props }: HatchProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-density={density}
      className={cn(decor, densityClass[density], className)}
    />
  );
}
