import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";

export type HazardStripeSize = "sm" | "md";

export type HazardStripeProps = Omit<ComponentProps<"div">, "children"> & {
  /** 条高 6px 或 12px */
  size?: HazardStripeSize;
};

const sizeClass: Record<HazardStripeSize, string> = {
  sm: "h-1.5",
  md: "h-3",
};

/**
 * 警示条纹：黄黑相间的窄条，和红色一样带"危险 / 施工"的含义。
 * 放在删除确认、不可逆操作这类区域的边缘；一个视口最多一处，普通内容不要用。
 * 它只是装饰：危险的含义必须另外用文字写出来。
 */
export function HazardStripe({
  size = "md",
  className,
  ...props
}: HazardStripeProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      // 有意不随主题变：警示条纹在哪种底色上都是黄黑两色
      className={cn(decor, "hazard w-full", sizeClass[size], className)}
    />
  );
}
