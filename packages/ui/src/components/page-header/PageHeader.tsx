import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { ArrowLeft } from "../../icons/ArrowLeft";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";

export type PageHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  /** 页面的标题 */
  title: ReactNode;
  /** 标题的层级，默认 1（`<h1>`）。页头用在抽屉、分栏里时改小 */
  level?: 1 | 2 | 3;
  /** 标题上面的微文字行，如 `// ARCHIVE　共 128 条` */
  meta?: ReactNode;
  /** 标题下面的一段说明 */
  description?: ReactNode;
  /** 最上面的层级路径：放一个 `Breadcrumb` */
  breadcrumb?: ReactNode;
  /** 标题左边的返回：放一个 `PageHeaderBack` */
  back?: ReactNode;
  /** 右边的行动区：几个按钮。放不下时折到标题下面 */
  actions?: ReactNode;
  /** 底下加一条分隔线 */
  divider?: boolean;
  /**
   * 吸在滚动容器的顶上，带实底和底下那条线。
   * 上面还有吸顶的顶栏时用 `className` 改 `top`
   */
  sticky?: boolean;
  /** 挂上时播放一次入场：微文字行 → 标题 → 说明。默认开启；`sticky` 时不播 */
  animate?: boolean;
  /** 标题下面的一行：页签、几个统计块 */
  children?: ReactNode;
};

/*
 * 入场的三拍：各自从左 8px 淡入归位，依次晚 100ms。
 * 挂上就播（纯 CSS）：页头在页面最上面，不用等它进视口
 */
const enter = "animate-shift-in [--shift-x:calc(var(--motion-shift-lg)*-1)]";
const enterStep = [
  enter,
  `${enter} [animation-delay:100ms]`,
  `${enter} [animation-delay:200ms]`,
] as const;

/**
 * 页头：这是哪一页、怎么回去、在这一页能做什么。一页一个。
 * 按自身的宽度响应：行动区放不下时折到标题下面。
 */
export function PageHeader({
  title,
  level = 1,
  meta,
  description,
  breadcrumb,
  back,
  actions,
  divider = false,
  sticky = false,
  animate = true,
  className,
  children,
  ...props
}: PageHeaderProps) {
  const Heading = `h${level}` as const;
  // 入场只动这三行字：面包屑、返回、行动区是能点的，位置在动的东西不好点
  const reveal = animate && !sticky;
  const first = meta ? 1 : 0;

  return (
    <header
      {...props}
      data-sticky={sticky ? "" : undefined}
      className={cn(
        "@container flex flex-col gap-4 text-ink",
        divider && !sticky && "border-b border-line pb-6",
        sticky &&
          "sticky top-0 z-(--z-float) border-b border-line bg-surface py-4",
        className,
      )}
    >
      {breadcrumb}
      <div className="flex flex-col gap-1">
        {meta && (
          <p
            className={cn(
              "font-tech text-xs text-ink-secondary",
              reveal && enterStep[0],
            )}
          >
            {meta}
          </p>
        )}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          {/* 标题这一组至少留 16rem：行动区挤不进来就整块折下去，而不是把标题挤成一个字一行 */}
          <div className="flex min-w-0 flex-1 basis-64 items-start gap-4">
            {/*
             * 标题的一行是 40px 高（宽了是 48px）。返回和行动区各放在同样高的一格里居中，
             * 所以它们对的是标题的第一行——标题折成几行、下面有没有说明都一样
             */}
            {back && (
              <div className="flex h-10 shrink-0 items-center @md:h-12">
                {back}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <Heading
                className={cn(
                  "min-w-0 text-2xl leading-10 font-bold wrap-anywhere @md:text-3xl @md:leading-12",
                  reveal && enterStep[first],
                )}
              >
                {title}
              </Heading>
              {description && (
                <p
                  className={cn(
                    "max-w-prose text-sm text-ink-secondary",
                    reveal && enterStep[first + 1],
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div
              data-actions=""
              className="flex min-h-10 flex-wrap items-center gap-2 @md:min-h-12"
            >
              {actions}
            </div>
          )}
        </div>
      </div>
      {children}
    </header>
  );
}

type BackOwnProps = {
  /** 默认"返回"。建议写成"返回某某" */
  "aria-label"?: string;
  /** 传了就渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
};

export type PageHeaderBackProps = BackOwnProps &
  Omit<ComponentProps<"button">, keyof BackOwnProps | "type" | "children">;

/**
 * 页头里的返回：40px 的深灰斜纹方块加一个左箭头，`back` 按钮收成的图标形态。
 * 放进 `PageHeader` 的 `back`。
 */
export function PageHeaderBack({
  "aria-label": label = "返回",
  href,
  target,
  rel,
  render,
  onClick,
  disabled = false,
  className,
  ...props
}: PageHeaderBackProps) {
  const classes = cn(
    "relative inline-flex size-10 shrink-0 items-center justify-center",
    "transition-colors duration-(--duration-fast) ease-standard",
    focusRing,
    disabled
      ? "cursor-not-allowed bg-disabled text-on-disabled"
      : // 有意不随主题翻转：和 back 按钮是同一块深灰
        "hatch hatch-mid bg-control text-white shadow-xs hover:bg-neutral-600 active:bg-control-pressed",
    className,
  );
  const icon = <ArrowLeft size={20} />;

  if (href !== undefined || render !== undefined) {
    return (
      <LinkElement
        render={render}
        // 禁用的链接去掉 href，保留 link 角色，让读屏仍能读出"不可用"
        href={disabled ? undefined : href}
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        aria-label={label}
        target={target}
        rel={rel}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        data-page-header-back=""
        className={classes}
      >
        {icon}
      </LinkElement>
    );
  }

  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      data-page-header-back=""
      className={classes}
    >
      {icon}
    </button>
  );
}
