import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import {
  cloneElement,
  createContext,
  useContext,
  useId,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePortalScope } from "../../hooks/usePortalScope";
import { cn } from "../../lib/cn";

export type TooltipSide = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";

/* 规范：出现前约 300ms，消失不延迟 */
const DEFAULT_DELAY = 300;

const InProviderContext = createContext(false);

export type TooltipProviderProps = {
  /** 这一组提示统一的延迟，毫秒 */
  delay?: number;
  /** 一个提示消失后多久之内，旁边的提示不用再等延迟，毫秒。默认 400 */
  timeout?: number;
  children: ReactNode;
};

/**
 * 可选。包住一组相邻的提示（工具栏）：第一个出现之后，移到旁边的不用再等延迟。
 */
export function TooltipProvider({
  delay = DEFAULT_DELAY,
  timeout,
  children,
}: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} timeout={timeout}>
      <InProviderContext value={true}>{children}</InProviderContext>
    </BaseTooltip.Provider>
  );
}

export type TooltipProps = {
  /** 提示的内容：一句话，不放交互元素 */
  content: ReactNode;
  /** 触发元素：一个能接收 `ref` 与事件的元素（按钮、链接） */
  children: ReactElement<Record<string, unknown>>;
  /** 出现在触发元素的哪一侧，放不下时自动翻到对面。默认 `top` */
  side?: TooltipSide;
  align?: TooltipAlign;
  /**
   * 悬停多久后出现，毫秒，默认 300。键盘聚焦时立刻出现；消失不延迟。
   * 在 `TooltipProvider` 里不传时跟随它的 `delay`。
   */
  delay?: number;
  /** 指向触发元素的小三角，默认有。关掉后提示贴着触发元素 */
  arrow?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 不再出现 */
  disabled?: boolean;
  /** 给提示本身 */
  className?: string;
};

const subscribeNever = () => () => {};

/** 常驻的隐藏文字，给 `aria-describedby` 用。挂在 `<body>` 下，不影响触发元素周围的排版 */
function Description({ id, children }: { id: string; children: ReactNode }) {
  // 服务端与水合时没有 document，挂载后才渲染
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(
    <span id={id} hidden>
      {children}
    </span>,
    document.body,
  );
}

/**
 * 悬停或键盘聚焦时出现的一句说明。触屏上不出现：必要的信息不要只放在这里。
 *
 * 触发元素要有自己的可访问名称（图标按钮的 `aria-label`）。提示的内容会作为
 * 补充说明关联给读屏；它和 `aria-label` 一字不差时不再重复关联。
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delay,
  arrow = true,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  className,
}: TooltipProps) {
  const descriptionId = useId();
  const inProvider = useContext(InProviderContext);
  // 提示是一块和页面相反的颜色。做成相反主题的局部主题，而不是直接用反转色：
  // 里面的键位提示、着色词因此也按这块底色取值，不会和底融在一起
  const { anchorRef, portalRef } = usePortalScope({ invertTheme: true });

  const label = children.props["aria-label"];
  const repeatsLabel =
    typeof content === "string" &&
    typeof label === "string" &&
    content.trim() === label.trim();
  const described = !disabled && !repeatsLabel;

  const existing = children.props["aria-describedby"];
  const trigger = described
    ? cloneElement(children, {
        "aria-describedby":
          typeof existing === "string"
            ? `${existing} ${descriptionId}`
            : descriptionId,
      })
    : children;

  return (
    <BaseTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange && ((next) => onOpenChange(next))}
      disabled={disabled}
    >
      <BaseTooltip.Trigger
        ref={anchorRef}
        render={trigger}
        delay={delay ?? (inProvider ? undefined : DEFAULT_DELAY)}
      />
      {described && <Description id={descriptionId}>{content}</Description>}
      <BaseTooltip.Portal ref={portalRef}>
        <BaseTooltip.Positioner
          side={side}
          align={align}
          sideOffset={arrow ? 8 : 2}
          className="z-(--z-overlay)"
        >
          <BaseTooltip.Popup
            className={cn(
              // 透明的边线：高对比模式下背景色被系统覆盖，边线会自己显形
              "relative max-w-64 border border-transparent bg-surface-raised px-2.5 py-1.5 text-sm wrap-anywhere text-ink",
              "origin-(--transform-origin) transition-opacity duration-(--duration-fast) ease-standard",
              "data-ending-style:opacity-0 data-instant:transition-none data-starting-style:opacity-0",
              className,
            )}
          >
            {arrow && (
              <BaseTooltip.Arrow
                aria-hidden="true"
                className={cn(
                  "size-2 rotate-45 bg-surface-raised forced-colors:hidden",
                  "data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1",
                )}
              />
            )}
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
