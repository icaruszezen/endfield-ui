import type { ComponentProps, ElementType, ReactNode } from "react";
import { useInView } from "../../hooks/useInView";
import { ArrowCorner } from "../../icons/ArrowCorner";
import { cn } from "../../lib/cn";

export type SectionTitleVariant = "standard" | "plain" | "band" | "side";

export type SectionTitleProps = Omit<ComponentProps<"header">, "title"> & {
  /**
   * - `standard` 灰色滑块 + 斜箭头 + 英文，下接中文。版块的第一级标题，默认；
   * - `plain` 只留标题和左侧一条短竖条。文档、设置这类工具页面；
   * - `band` 通栏信号黄色带。亮暗版块之间的过渡，一页最多一到两条；
   * - `side` 竖排侧签。贴在横向展开的版块左缘，窄屏下回到横排。
   */
  variant?: SectionTitleVariant;
  /** 真正的标题文字 */
  children: ReactNode;
  /** 英文结构层：`standard` 的栏目名、`side` 的大字。写真实的栏目名 */
  latin?: ReactNode;
  /** `band` 主题上方的小号副题 */
  subtitle?: ReactNode;
  /** `standard` 顶部的微文字行，如 `// 新闻　2026.10.08` */
  meta?: ReactNode;
  /** 标题层级，默认 2（`<h2>`） */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** `standard` 进入视口时播放一次入场，默认开启 */
  animate?: boolean;
  /** 英文只是标题的翻译时对读屏隐藏，避免重复朗读。默认隐藏 */
  latinHidden?: boolean;
  /** `side` 的底色：`accent` 信号黄，`muted` 浅灰 */
  tone?: "accent" | "muted";
  /** `band` 与 `side` 的线稿插图位，纯装饰 */
  illustration?: ReactNode;
};

export function SectionTitle({
  variant = "standard",
  children,
  latin,
  subtitle,
  meta,
  level = 2,
  animate = true,
  latinHidden = true,
  tone = "accent",
  illustration,
  className,
  ref: forwardedRef,
  ...props
}: SectionTitleProps) {
  const Heading: ElementType = `h${level}`;
  const reveal = variant === "standard" && animate;
  const [inViewRef, inView] = useInView<HTMLElement>({ disabled: !reveal });

  const ref = (node: HTMLElement | null) => {
    inViewRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  if (variant === "plain") {
    return (
      <header
        {...props}
        ref={ref}
        className={cn("flex items-center gap-3", className)}
      >
        <span aria-hidden="true" className="h-6 w-1 shrink-0 bg-ink" />
        <Heading className="min-w-0 text-2xl font-bold wrap-anywhere text-ink">
          {children}
        </Heading>
      </header>
    );
  }

  if (variant === "band") {
    // 色带按自身宽度响应（容器查询），不看视口：它可能被放进窄栏里。
    // 字号与留白随宽度分三档，插图在窄处去掉；wrap-anywhere 兜底，长单词也不会溢出
    return (
      <header
        {...props}
        ref={ref}
        className={cn("@container bg-action text-on-action", className)}
      >
        <div className="flex min-h-16 items-center gap-4 px-4 py-4 @md:min-h-24 @md:gap-6 @md:px-10">
          {illustration && (
            <div aria-hidden="true" className="hidden shrink-0 @sm:block">
              {illustration}
            </div>
          )}
          <div className="min-w-0">
            {subtitle && (
              <p className="font-latin text-base leading-tight font-light wrap-anywhere uppercase @md:text-lg">
                {subtitle}
              </p>
            )}
            <Heading className="font-latin text-xl font-medium wrap-anywhere uppercase @xs:text-2xl @md:text-3xl">
              {children}
            </Heading>
          </div>
        </div>
      </header>
    );
  }

  if (variant === "side") {
    return (
      <header
        {...props}
        ref={ref}
        className={cn(
          "flex flex-wrap items-center gap-3 px-4 py-3",
          "md:self-stretch md:px-3 md:py-6 md:[writing-mode:vertical-rl]",
          tone === "accent"
            ? "bg-action text-on-action"
            : "bg-surface-muted text-ink",
          className,
        )}
      >
        {illustration && (
          <div aria-hidden="true" className="shrink-0">
            {illustration}
          </div>
        )}
        <Heading className="text-sm font-medium">{children}</Heading>
        {latin && (
          <p
            aria-hidden={latinHidden || undefined}
            className="max-w-full font-latin text-2xl font-medium wrap-anywhere uppercase"
          >
            {latin}
          </p>
        )}
      </header>
    );
  }

  // 入场顺序：滑块 → 箭头 → 文字，每步错开 100ms
  const pending = reveal && !inView;
  const playing = reveal && inView;

  return (
    <header {...props} ref={ref} className={className}>
      {meta && (
        <p
          className={cn(
            "mb-2 font-tech text-xs text-ink-secondary",
            pending && "opacity-0",
            playing && "animate-fade-in [animation-delay:200ms]",
          )}
        >
          {meta}
        </p>
      )}
      {/* 放不下时英文折到滑块下面一行，而不是顶出容器 */}
      <div className="flex flex-wrap items-center gap-x-2">
        <span
          aria-hidden="true"
          className="relative block h-8 w-26 shrink-0 overflow-hidden"
        >
          {/* 滑块在亮暗两个主题下都是浅灰，所以箭头固定用墨色 */}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-end bg-neutral-300 pr-1.5 text-neutral-900",
              pending && "-translate-x-full",
              playing && "animate-slide-in",
            )}
          >
            <ArrowCorner
              size={20}
              className={cn(
                pending && "-rotate-45",
                playing && "animate-turn-in [animation-delay:100ms]",
              )}
            />
          </span>
        </span>
        {latin && (
          <p
            aria-hidden={latinHidden || undefined}
            className={cn(
              "max-w-full font-latin text-xl leading-8 font-medium wrap-anywhere text-ink uppercase",
              pending && "opacity-0",
              playing && "animate-fade-in [animation-delay:200ms]",
            )}
          >
            {latin}
          </p>
        )}
      </div>
      <Heading
        className={cn(
          "mt-1 text-2xl font-bold wrap-anywhere text-ink",
          pending && "opacity-0",
          playing && "animate-fade-in [animation-delay:200ms]",
        )}
      >
        {children}
      </Heading>
    </header>
  );
}
