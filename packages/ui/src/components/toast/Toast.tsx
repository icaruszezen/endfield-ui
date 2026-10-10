import { Toast as BaseToast } from "@base-ui/react/toast";
import {
  createContext,
  isValidElement,
  useContext,
  useMemo,
  type ComponentType,
  type ReactNode,
} from "react";
import { Close } from "../../icons/Close";
import type { IconProps } from "../../icons/createIcon";
import { StatusDanger } from "../../icons/StatusDanger";
import { StatusInfo } from "../../icons/StatusInfo";
import { StatusSuccess } from "../../icons/StatusSuccess";
import { StatusWarning } from "../../icons/StatusWarning";
import { cn } from "../../lib/cn";
import { focusRing, focusRingInset } from "../../lib/focus-ring";

export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";
export type ToastPlacement = "bottom" | "center";

export type ToastAction = {
  label: ReactNode;
  /** 点了之后这条提示随即关掉 */
  onClick: () => void;
};

export type ToastOptions = {
  /** 一句话 */
  message: ReactNode;
  /** 文字前的小图形，区分成功与失败。底色不变。默认 `neutral`：没有图形 */
  tone?: ToastTone;
  /** 一个操作，比如"撤销"。带操作的提示多停一会儿，并出现关闭图标 */
  action?: ToastAction;
  /** 停留多久，毫秒。`0` 是一直留着，直到被关掉或被下一条替换 */
  duration?: number;
};

export type ToastApi = {
  /** 弹出一条，返回它的 id。上一条还在的话会被它替换 */
  (input: ReactNode | ToastOptions): string;
  /** 关掉指定的一条；不传 id 就关掉当前这条 */
  dismiss: (id?: string) => void;
};

type ToastData = {
  tone: ToastTone;
  dismissible: boolean;
};

/* 带操作的提示默认停留的时间：要留出读完再去点的工夫 */
const ACTION_DURATION = 8000;

const ToastContext = createContext<ToastApi | null>(null);

/** 弹出轻提示。要在 `ToastProvider` 里面用。 */
export function useToast(): ToastApi {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error("useToast 要在 <ToastProvider> 里面用");
  }
  return toast;
}

/* 和提示条一样，四种色调用四种不同外形的图标 */
const toneIcon: Record<
  Exclude<ToastTone, "neutral">,
  ComponentType<IconProps>
> = {
  info: StatusInfo,
  success: StatusSuccess,
  warning: StatusWarning,
  danger: StatusDanger,
};

const toneText: Record<Exclude<ToastTone, "neutral">, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/*
 * 水平居中 + 跟着手指走的位移（可以往下或往右划走）。
 *
 * 写在 transform 上，不能写在 translate 上：基元在拖动的时候自己往元素上写内联的
 * transform（从元素现在的 transform 出发，加上指针走过的距离），并把过渡关掉；松手
 * 之后交还给这里的变量。位置写在别的属性上的话两处会叠加——提示走的是手指的两倍。
 *
 * 进场的位移另写在 translate 上（只在起点有）：两个属性各管各的，"滑入"的过渡碰不到
 * "跟手"的那一份。底部的从下面来；正中的是官网的做法，只有透明度。
 *
 * 新旧两条在同一个位置交替，所以用绝对定位叠在一起：旧的原地淡出，新的升上来
 */
const placementClass: Record<
  ToastPlacement,
  { viewport: string; root: string }
> = {
  bottom: {
    viewport: "bottom-6",
    root: "bottom-0 transform-[translate(calc(-50%+var(--toast-swipe-movement-x,0px)),var(--toast-swipe-movement-y,0px))] data-starting-style:translate-y-(--motion-shift-lg)",
  },
  center: {
    viewport: "top-1/2",
    root: "top-0 transform-[translate(calc(-50%+var(--toast-swipe-movement-x,0px)),calc(-50%+var(--toast-swipe-movement-y,0px)))]",
  },
};

function isOptions(input: ReactNode | ToastOptions): input is ToastOptions {
  return (
    typeof input === "object" &&
    input !== null &&
    !isValidElement(input) &&
    "message" in input
  );
}

let counter = 0;

type ToastHostProps = {
  placement: ToastPlacement;
  label: string;
  closeLabel: string;
  children: ReactNode;
};

function ToastHost({ placement, label, closeLabel, children }: ToastHostProps) {
  const { toasts, add, close } = BaseToast.useToastManager<ToastData>();

  const api = useMemo<ToastApi>(() => {
    const show = (input: ReactNode | ToastOptions) => {
      const options = isOptions(input) ? input : { message: input };
      const { message, tone = "neutral", action, duration } = options;
      const id = `ef-toast-${++counter}`;

      // 同时只显示一条：新的替换旧的
      close();
      return add({
        id,
        title: message,
        type: tone,
        // 警告与失败要打断读屏当前在读的内容，其余的排队
        priority: tone === "danger" || tone === "warning" ? "high" : "low",
        timeout: duration ?? (action ? ACTION_DURATION : undefined),
        actionProps: action && {
          children: action.label,
          onClick: () => {
            action.onClick();
            close(id);
          },
        },
        data: { tone, dismissible: action !== undefined || duration === 0 },
      });
    };
    show.dismiss = (id?: string) => close(id);
    return show;
  }, [add, close]);

  return (
    <ToastContext value={api}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport
          aria-label={label}
          className={cn(
            "pointer-events-none fixed inset-x-4 z-(--z-toast) h-0",
            placementClass[placement].viewport,
          )}
        >
          {toasts.map((toast) => {
            const tone = toast.data?.tone ?? "neutral";
            const Icon = tone === "neutral" ? null : toneIcon[tone];
            return (
              <BaseToast.Root
                key={toast.id}
                toast={toast}
                // 黑底白字不随主题变：整条做成暗色的局部主题，图形和焦点环按深色底取值
                data-theme="dark"
                className={cn(
                  "pointer-events-auto absolute left-1/2 w-max max-w-full",
                  // 边线是给暗色页面的：那里黑底和页面几乎一样深，要靠它把提示勾出来。
                  // 亮色页面上它和提示的底几乎同色，看不出来
                  "border border-line bg-black/80 text-base leading-[1.4] text-white",
                  // 三样各走各的：淡入淡出 200ms；进场的位移 300ms；没划够就松手，滑回原位 200ms。
                  // 拖动中基元把过渡整个关掉，位置贴着手指
                  "transition-[opacity,translate,transform] duration-[var(--duration-fast),var(--duration-base),var(--duration-fast)] ease-[var(--ease-standard),var(--ease-exit),var(--ease-standard)]",
                  "data-ending-style:opacity-0 data-starting-style:opacity-0",
                  // 拖的时候不选中文字：用鼠标拖会把字选上，下一次再拖，浏览器当成"拖这段字"，手势就被取消了
                  "data-swiping:select-none",
                  // 焦点环画在里面：它是按深色底取的颜色，画到外面会压在亮色的页面上
                  focusRingInset,
                  placementClass[placement].root,
                )}
              >
                <BaseToast.Content
                  className={cn(
                    "flex items-center gap-3 py-2.5 pl-5",
                    toast.data?.dismissible ? "pr-2" : "pr-5",
                  )}
                >
                  {Icon && tone !== "neutral" && (
                    <Icon
                      size={16}
                      className={cn("shrink-0", toneText[tone])}
                    />
                  )}
                  <BaseToast.Title
                    render={<p />}
                    className="min-w-0 wrap-anywhere"
                  />
                  {toast.actionProps && (
                    <BaseToast.Action
                      className={cn(
                        "shrink-0 border-b border-current text-sm font-medium text-accent-ink active:opacity-80",
                        focusRing,
                      )}
                    />
                  )}
                  {toast.data?.dismissible && (
                    <BaseToast.Close
                      aria-label={closeLabel}
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center text-ink-secondary hover:text-ink",
                        focusRing,
                      )}
                    >
                      <Close size={16} />
                    </BaseToast.Close>
                  )}
                </BaseToast.Content>
              </BaseToast.Root>
            );
          })}
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </ToastContext>
  );
}

export type ToastProviderProps = {
  /** 出现在哪：视口底部居中（默认），或者视口正中（官网的做法） */
  placement?: ToastPlacement;
  /** 默认停留多久，毫秒。规范是 2 – 4 秒 */
  duration?: number;
  /** 提示区域的可访问名称（按 `F6` 可以把焦点移进来） */
  label?: string;
  /** 关闭图标的可访问名称 */
  closeLabel?: string;
  children: ReactNode;
};

/**
 * 轻提示的容器，包在应用的最外层。里面的任何地方用 `useToast()` 弹出。
 * 重要的、需要用户处理的信息不要用轻提示，用提示条或弹窗。
 */
export function ToastProvider({
  placement = "bottom",
  duration = 3000,
  label = "通知",
  closeLabel = "关闭",
  children,
}: ToastProviderProps) {
  return (
    <BaseToast.Provider timeout={duration} limit={1}>
      <ToastHost placement={placement} label={label} closeLabel={closeLabel}>
        {children}
      </ToastHost>
    </BaseToast.Provider>
  );
}
