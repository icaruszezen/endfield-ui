import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useIndicator } from "../../hooks/useIndicator";
import {
  useScrollPosition,
  type ScrollMetrics,
} from "../../hooks/useScrollPosition";
import { cn } from "../../lib/cn";
import { focusRingInset } from "../../lib/focus-ring";
import { mergeRefs } from "../../lib/merge-refs";
import { indicator } from "../../lib/motion";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";

export type TocLevel = 1 | 2 | 3;

const TocContext = createContext<{
  active: string | null;
  pick: (section: string) => void;
}>({ active: null, pick: () => {} });

type TocOwnProps = {
  /** 列表上面的一行小标。有它时目录以它命名 */
  title?: ReactNode;
  /**
   * 视口上沿往下让多少像素才算"到了"。页面有吸顶的页头时传页头的高度，
   * 并给各节的标题加同样大小的 `scroll-mt-*`
   */
  offset?: number;
  /** 内容在哪个滚动容器里。不传就是整个页面 */
  target?: RefObject<HTMLElement | null>;
  /** 当前的小节变了：拿到它的 `id`，一节都还没到时是 `null` */
  onActiveChange?: (section: string | null) => void;
  /** `TocItem` */
  children: ReactNode;
};

export type TocProps = TocOwnProps &
  Omit<ComponentProps<"nav">, keyof TocOwnProps>;

/** 点了一项之后，多久没有滚动事件算这一次滚动停下了 */
const SETTLE_MS = 150;

/**
 * 页内目录：这一页有哪几节、现在看到了哪一节。里面放 `TocItem`。
 *
 * 位置由使用方给，通常是 `className="sticky top-6"`。点一项就是点一个锚点链接：
 * 滚不滚、平不平滑是浏览器和页面 CSS 的事，它不接管滚动。
 */
export function Toc({
  title,
  offset = 0,
  target,
  onActiveChange,
  "aria-label": ariaLabel,
  className,
  ref,
  children,
  ...props
}: TocProps) {
  const navRef = useRef<HTMLElement>(null);
  // 当前项的粗条画在列表上：换一项时是同一段沿引线滑过去
  const listRef = useIndicator<HTMLUListElement>("[aria-current]");
  const titleId = useId();
  // 目录的项数变了（内容是后来才到的）要重新算一次，不等下一次滚动
  const count = Children.count(children);

  // 哪一节是当前的：最后一个顶边已经到了上沿的；滚到底时是最后一节
  const read = useCallback(
    ({ scrolled, room }: ScrollMetrics) => {
      const nav = navRef.current;
      if (!nav) return null;
      const container = target?.current;
      const top = container ? container.getBoundingClientRect().top : 0;

      let active: string | null = null;
      let last: string | null = null;
      for (const link of nav.querySelectorAll<HTMLElement>(
        "[data-toc-section]",
      )) {
        const id = link.dataset.tocSection!;
        const section = document.getElementById(id);
        if (!section) continue;
        last = id;
        if (section.getBoundingClientRect().top - top <= offset + 1) {
          active = id;
        }
      }
      // 最后一节往往很短，顶边永远到不了上沿
      if (room > 0 && scrolled >= room - 1) return last;
      return active;
    },
    // count 没在里面用到：它变了这个函数就换一个，滚动的监听跟着重新接、重新算一次
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [target, offset, count],
  );
  const spied = useScrollPosition<string | null>(target, read, null);

  // 点了一项：它立刻是当前项，保持到这一次滚动停下、使用者自己再滚为止。
  // 否则点倒数第二节、它到不了上沿，亮起来的会是别的
  const [pinned, setPinned] = useState<string | null>(null);
  useEffect(() => {
    if (pinned === null) return;
    const source = target?.current ?? window;
    let settled = false;
    let timer = setTimeout(() => {
      settled = true;
    }, SETTLE_MS);
    const onScroll = () => {
      if (settled) {
        setPinned(null);
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        settled = true;
      }, SETTLE_MS);
    };
    source.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      source.removeEventListener("scroll", onScroll);
    };
  }, [pinned, target]);

  const active = pinned ?? spied;

  const report = useRef(onActiveChange);
  report.current = onActiveChange;
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (reported.current === active) return;
    reported.current = active;
    report.current?.(active);
  }, [active]);

  // 目录自己能滚的时候（使用方给了高度上限），当前项保持在看得见的范围里。
  // 只动目录自己的滚动位置，不碰页面
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || active === null) return;
    if (nav.scrollHeight <= nav.clientHeight + 1) return;
    const link = nav.querySelector<HTMLElement>("[aria-current]");
    if (!link) return;
    const box = nav.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    if (rect.top < box.top) nav.scrollTop -= box.top - rect.top + 8;
    else if (rect.bottom > box.bottom) {
      nav.scrollTop += rect.bottom - box.bottom + 8;
    }
  }, [active]);

  const context = useMemo(() => ({ active, pick: setPinned }), [active]);
  const hasTitle = title !== undefined && title !== null && title !== false;

  return (
    <nav
      {...props}
      ref={mergeRefs(navRef, ref)}
      aria-label={ariaLabel ?? (hasTitle ? undefined : "本页目录")}
      aria-labelledby={
        ariaLabel === undefined && hasTitle ? titleId : undefined
      }
      className={cn("text-sm text-ink", className)}
    >
      {hasTitle && (
        <p
          id={titleId}
          className="mb-2 pl-4 font-tech text-xs text-ink-secondary"
        >
          {title}
        </p>
      )}
      {/* 引线：从头贯到尾的一条细线；当前项那一段是压在它上面的粗条 */}
      <ul
        ref={listRef}
        className={cn(
          // 和粗条同一层：它在前、粗条在后，粗条压着它；两样都在各项之下
          "before:absolute before:inset-y-0 before:left-0 before:-z-1 before:w-px before:bg-line before:content-['']",
          indicator,
          // 3px 宽，比当前项上下各短 4px；长度跟着那一项的高度走
          "after:top-1 after:h-[calc(var(--indicator-h)-0.5rem)] after:w-[3px] after:translate-y-(--indicator-y) after:bg-ink",
        )}
      >
        <TocContext value={context}>{children}</TocContext>
      </ul>
    </nav>
  );
}

type TocItemOwnProps = {
  /** `#小节的 id`。小节就是按 `#` 后面这一段找的 */
  href?: string;
  /** 小节的 `id`。地址在 `render` 那个元素手里时用它 */
  section?: string;
  /** 第几级，只影响缩进。默认 1 */
  level?: TocLevel;
  /** 用这个元素代替 `<a>`（路由库的链接组件） */
  render?: LinkRender;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
};

export type TocItemProps = TocItemOwnProps &
  Omit<ComponentProps<"li">, keyof TocItemOwnProps>;

const levelPadding: Record<TocLevel, string> = {
  1: "pl-4",
  2: "pl-7",
  3: "pl-10",
};

const sectionOf = (href: string | undefined) => {
  const hash = href?.split("#")[1];
  if (!hash) return undefined;
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
};

/** 目录里的一项：一个指向小节的锚点链接。 */
export function TocItem({
  href,
  section = sectionOf(href),
  level = 1,
  render,
  onClick,
  children,
  ...props
}: TocItemProps) {
  const { active, pick } = useContext(TocContext);
  const current = section !== undefined && section === active;

  return (
    <li {...props}>
      <LinkElement
        render={render}
        href={href}
        data-toc-section={section}
        data-level={level}
        aria-current={current ? "location" : undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && section !== undefined) pick(section);
        }}
        className={cn(
          "relative block py-2 pr-2 leading-snug wrap-anywhere",
          "transition-colors duration-(--duration-fast) ease-standard",
          // 目录自己可能在一个会滚动的容器里：环画在里面
          focusRingInset,
          levelPadding[level],
          current
            ? // 不加粗：加粗会让折行变掉，整列目录跟着跳。靠的是引线上的这一段粗条——
              // 列表量到了位置就由列表上滑动的那一段来画，这里的让出来
              "text-ink before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:bg-ink before:content-[''] in-data-indicator:before:hidden"
            : "text-ink-secondary hover:text-ink",
        )}
      >
        {children}
      </LinkElement>
    </li>
  );
}
