import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";

export type RegistrationStripOrientation = "horizontal" | "vertical";

export type RegistrationStripProps = Omit<
  ComponentProps<"div">,
  "children"
> & {
  /** 横条高 3px、每段 64px；竖条是三段 6 × 14px 叠放 */
  orientation?: RegistrationStripOrientation;
  /** 横条后面接一段灰线、撑满容器：用作名称下方的分隔线 */
  rule?: boolean;
};

// 有意不随主题变：印刷校准用的三原色，只做装饰，不要用在别处
const segments = ["bg-reg-magenta", "bg-reg-cyan", "bg-reg-yellow"] as const;

/**
 * 注册色条：品红、青、黄三段的微条，印刷品语气的点缀。
 * 纯装饰，不承担任何数据或状态含义；一个版块最多一处，离图表远一点。
 */
export function RegistrationStrip({
  orientation = "horizontal",
  rule = false,
  className,
  ...props
}: RegistrationStripProps) {
  const vertical = orientation === "vertical";

  return (
    <div
      {...props}
      aria-hidden="true"
      data-orientation={orientation}
      className={cn(
        decor,
        vertical
          ? "inline-flex flex-col"
          : ["flex h-[3px] max-w-full", rule && "w-full"],
        className,
      )}
    >
      {segments.map((color) => (
        <span
          key={color}
          className={cn(color, vertical ? "h-3.5 w-1.5" : "w-16 min-w-0")}
        />
      ))}
      {rule && !vertical && <span className="min-w-0 flex-1 bg-line" />}
    </div>
  );
}
