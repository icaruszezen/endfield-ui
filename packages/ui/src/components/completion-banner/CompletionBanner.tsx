import type { ComponentProps, ElementType, ReactNode } from "react";
import { useInView } from "../../hooks/useInView";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { GhostText } from "../ghost-text/GhostText";

export type CompletionBannerProps = Omit<ComponentProps<"div">, "title"> & {
  /** 一句话说明完成了什么："第三阶段已完成" */
  title: ReactNode;
  /** 背后的巨型描边词，默认 `COMPLETED`。纯装饰；传 `null` 去掉 */
  word?: ReactNode;
  /** 标题下的一行说明 */
  description?: ReactNode;
  /** 右侧的一个行动：领取、查看下一阶段 */
  action?: ReactNode;
  /** 标题层级，默认 3（`<h3>`） */
  level?: 2 | 3 | 4 | 5 | 6;
  /** 进入视口时播放一次入场：色带从左擦入，随后出字。默认开启 */
  animate?: boolean;
};

/**
 * 完成横幅：一个阶段全部完成时，头部区域做一次明暗反转。
 * 只在真正的里程碑上用；日常的"保存成功"用提示条就够了。
 *
 * 底是反转块：亮色主题下是深底黄字，暗色主题下是浅底深字。
 * 整块是一个 `data-theme="inverse"` 的局部主题，`action` 里的按钮按这块底色取值。
 */
export function CompletionBanner({
  title,
  word = "COMPLETED",
  description,
  action,
  level = 3,
  animate = true,
  className,
  children,
  ref,
  ...props
}: CompletionBannerProps) {
  const Heading: ElementType = `h${level}`;
  const [inViewRef, inView] = useInView<HTMLDivElement>({ disabled: !animate });
  // 入场：整块从左擦入（背后的描边词在右下角，自然最后露出来），字和按钮等色带过去了再出
  const pending = animate && !inView;
  const playing = animate && inView;

  return (
    <div
      role="status"
      data-theme="inverse"
      {...props}
      ref={mergeRefs(inViewRef, ref)}
      className={cn(
        "@container relative isolate overflow-clip bg-surface text-ink",
        pending && "[clip-path:inset(0_100%_0_0)]",
        playing && "animate-wipe-in",
        className,
      )}
    >
      {word !== null && (
        <GhostText
          variant="outline"
          // 描边比默认的重一些，在这块底上才看得出来。
          // 贴右下角、向左淡出，不从标题和说明后面穿过；容器窄到放不下时去掉
          className="absolute -right-2 -bottom-3 -z-10 hidden text-5xl [--ghost-ink:color-mix(in_srgb,var(--ef-ink)_28%,transparent)] [mask-image:linear-gradient(to_left,black_45%,transparent)] @md:block"
        >
          {word}
        </GhostText>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 @md:px-6 @md:py-5">
        {/* 强调色跟着这块底走：亮色页面上是黄字压墨底，暗色页面上是深黄字压近白底 */}
        <div
          className={cn(
            "min-w-0 border-l-4 border-accent-ink pl-3",
            playing &&
              "animate-shift-in [animation-delay:200ms] [--shift-x:calc(var(--motion-shift-lg)*-1)]",
          )}
        >
          <Heading className="text-lg font-bold wrap-anywhere text-accent-ink @md:text-xl">
            {title}
          </Heading>
          {description && (
            <p className="mt-1 text-sm text-ink/70">{description}</p>
          )}
          {children}
        </div>
        {action && (
          <div
            className={cn(
              "shrink-0",
              playing && "animate-fade-in [animation-delay:200ms]",
            )}
          >
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
