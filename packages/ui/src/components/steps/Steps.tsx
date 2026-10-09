import {
  Children,
  createContext,
  useContext,
  type ComponentProps,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { Check } from "../../icons/Check";
import { StatusDanger } from "../../icons/StatusDanger";
import { cn } from "../../lib/cn";
import { focusRingWithin } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";

export type StepsOrientation = "horizontal" | "vertical";
export type StepsSize = "sm" | "md";
export type StepStatus = "done" | "current" | "upcoming";

/** 读屏听到的状态。未到的步骤不另说 */
export type StepStatusLabels = {
  done: string;
  current: string;
  invalid: string;
};

const defaultLabels: StepStatusLabels = {
  done: "已完成",
  current: "当前步骤",
  invalid: "有误",
};

type StepContextValue = {
  index: number;
  status: StepStatus;
  orientation: StepsOrientation;
  size: StepsSize;
  labels: StepStatusLabels;
};

const StepContext = createContext<StepContextValue | null>(null);

export type StepsProps = Omit<ComponentProps<"ol">, "aria-label"> & {
  /** 这是哪件事的步骤，比如"建站流程" */
  "aria-label": string;
  /** 走到了第几步，从 0 起。等于步数时全部是已完成 */
  current: number;
  /**
   * - `horizontal` 横排，默认。所在的容器窄于 28rem 时自动改成竖排；
   * - `vertical` 一直竖排。
   */
  orientation?: StepsOrientation;
  size?: StepsSize;
  /** 换掉读屏听到的那几句状态 */
  statusLabels?: Partial<StepStatusLabels>;
  /** 直接放 `Step` */
  children: ReactNode;
};

/*
 * 竖排是底子，横排是在容器够宽（@md，28rem）时盖上去的一层：
 * 这样横排在窄容器里自己就退回竖排，不用另写一遍。
 */
const listLayout: Record<StepsOrientation, string> = {
  vertical: "flex-col",
  horizontal: "flex-col @md:flex-row",
};

const itemLayout: Record<StepsOrientation, string> = {
  vertical: "gap-3",
  horizontal: "gap-3 @md:flex-1 @md:flex-col @md:gap-2",
};

const railLayout: Record<StepsOrientation, string> = {
  vertical: "flex-col",
  horizontal: "flex-col @md:flex-row",
};

/* 线和节点之间留 8px，不从节点后面穿过 */
const lineLayout: Record<StepsOrientation, string> = {
  vertical: "my-2 min-h-4 w-0.5",
  horizontal:
    "my-2 min-h-4 w-0.5 @md:mx-2 @md:my-0 @md:h-0.5 @md:min-h-0 @md:w-auto",
};

const bodyLayout: Record<StepsOrientation, string> = {
  vertical: "pb-4 group-last/step:pb-0",
  horizontal: "pb-4 group-last/step:pb-0 @md:pr-4 @md:pb-0",
};

/**
 * 步骤条：一件事分几步做，一共几步、走到了哪一步。里面只放 `Step`。
 * 每一步的状态由 `current` 和它的位置算出来。
 *
 * `className` 给最外面的那层（它是量宽度的容器），其余属性给里面的 `<ol>`。
 */
export function Steps({
  current,
  orientation = "horizontal",
  size = "md",
  statusLabels,
  className,
  children,
  ...props
}: StepsProps) {
  const labels = { ...defaultLabels, ...statusLabels };
  const steps = Children.toArray(children);

  return (
    <div
      data-orientation={orientation}
      data-size={size}
      className={cn("@container w-full text-ink", className)}
    >
      <ol {...props} className={cn("flex", listLayout[orientation])}>
        {steps.map((step, index) => (
          <StepContext
            // 步骤是按位置认的：序号、状态都从位置来
            key={index}
            value={{
              index,
              status:
                index < current
                  ? "done"
                  : index === current
                    ? "current"
                    : "upcoming",
              orientation,
              size,
              labels,
            }}
          >
            {step}
          </StepContext>
        ))}
      </ol>
    </div>
  );
}

type StepOwnProps = {
  title: ReactNode;
  /** 标题下的说明 */
  description?: ReactNode;
  /** 这一步有东西没填对：节点换成警示图标，读屏多听到一句"有误" */
  invalid?: boolean;
  /** 传了就可以点（回到做过的步骤）：标题是链接，点击范围铺满这一步 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替标题里的 `<a>`（路由库的链接组件） */
  render?: LinkRender;
  /** 不是链接、但要能点时用它：标题是按钮 */
  onClick?: MouseEventHandler<HTMLElement>;
};

export type StepProps = StepOwnProps &
  Omit<ComponentProps<"li">, keyof StepOwnProps | "children">;

const nodeSize: Record<StepsSize, string> = {
  sm: "size-5 text-micro [&_svg]:size-3",
  md: "size-6 text-xs [&_svg]:size-3.5",
};

const nodeClass: Record<StepStatus, string> = {
  // 墨底黄勾：和选中的复选框是同一个逻辑
  done: "bg-surface-inverse text-accent-ink-inverse",
  // 描一圈最细的线：黄色对白底立不住。颜色跟着文字走，暗色下是近白
  current: "border border-ink bg-action font-bold text-on-action",
  upcoming: "border border-line-strong text-ink-secondary",
};

const titleSize: Record<StepsSize, string> = {
  sm: "text-xs",
  md: "text-sm",
};

const titleClass: Record<StepStatus, string> = {
  done: "font-medium text-ink",
  current: "font-bold text-ink",
  upcoming: "font-medium text-ink-secondary",
};

export function Step({
  title,
  description,
  invalid = false,
  href,
  target,
  rel,
  render,
  onClick,
  className,
  ...props
}: StepProps) {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error("<Step> 必须放在 <Steps> 里");
  }
  const { index, status, orientation, size, labels } = context;
  const isLink = href !== undefined || render !== undefined;
  const interactive = isLink || onClick !== undefined;

  // 读屏听到的状态：节点和线都是画给眼睛看的
  const spoken = [
    status === "done"
      ? labels.done
      : status === "current"
        ? labels.current
        : "",
    invalid ? labels.invalid : "",
  ]
    .filter(Boolean)
    .join("，");

  // 焦点环画在整一步上；点击范围用伪元素铺满这一步
  const hit =
    "text-left outline-none after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4";

  const heading = (
    <>
      {spoken !== "" && <span className="sr-only">{`${spoken}：`}</span>}
      {title}
    </>
  );

  return (
    <li
      {...props}
      data-status={status}
      data-invalid={invalid ? "" : undefined}
      aria-current={status === "current" ? "step" : undefined}
      className={cn(
        "group/step relative flex min-w-0",
        itemLayout[orientation],
        interactive && focusRingWithin,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("flex shrink-0 items-center", railLayout[orientation])}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center font-tech leading-none tabular-nums",
            nodeSize[size],
            invalid ? "border border-danger text-danger" : nodeClass[status],
          )}
        >
          {invalid ? (
            <StatusDanger />
          ) : status === "done" ? (
            <Check />
          ) : (
            String(index + 1).padStart(2, "0")
          )}
        </span>
        {/* 这一步走完了，通向下一步的线才是实的 */}
        <span
          className={cn(
            "flex-1 group-last/step:hidden",
            lineLayout[orientation],
            status === "done" ? "bg-ink" : "bg-line-strong",
          )}
        />
      </span>
      <div className={cn("min-w-0 flex-1", bodyLayout[orientation])}>
        <div
          className={cn(
            "wrap-anywhere",
            titleSize[size],
            titleClass[status],
            // 竖排时标题的第一行对齐节点的中线
            size === "md" ? "leading-6" : "leading-5",
          )}
        >
          {isLink ? (
            <LinkElement
              render={render}
              href={href}
              target={target}
              rel={rel}
              onClick={onClick}
              className={hit}
            >
              {heading}
            </LinkElement>
          ) : onClick ? (
            <button type="button" onClick={onClick} className={hit}>
              {heading}
            </button>
          ) : (
            heading
          )}
        </div>
        {description !== undefined && (
          <div className="mt-0.5 text-xs text-ink-secondary">{description}</div>
        )}
      </div>
    </li>
  );
}
