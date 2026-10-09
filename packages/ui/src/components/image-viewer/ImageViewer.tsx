import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { ChevronLeft } from "../../icons/ChevronLeft";
import { ChevronRight } from "../../icons/ChevronRight";
import { Close } from "../../icons/Close";
import { cn } from "../../lib/cn";
import { focusRing } from "../../lib/focus-ring";
import { useSnapTrack } from "../carousel/snap-track";
import { overlayClose, overlayHeader } from "../dialog/overlay-style";
import { IconButton } from "../icon-button/IconButton";
import { Viewfinder } from "../viewfinder/Viewfinder";

export type ImageViewerRatio = "16/9" | "4/3" | "1/1" | "3/4";

const ratioClass: Record<ImageViewerRatio, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-4/3",
  "1/1": "aspect-square",
  "3/4": "aspect-3/4",
};

type ItemLike = {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
};

const ItemContext = createContext<{
  position: number;
  count: number;
  ratio: ImageViewerRatio;
  viewLabel: string;
  open: (position: number) => void;
  register: (position: number, node: HTMLButtonElement | null) => void;
} | null>(null);

export type ImageViewerProps = Omit<ComponentProps<"ul">, "aria-label"> & {
  /** 这组图是什么，比如"现场照片"。缩略图的列表和大图层都用它命名 */
  "aria-label": string;
  /** 大图层开没开 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 大图层现在是第几张，从 0 起 */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** 到头之后绕回另一头。默认到头时翻页钮禁用 */
  loop?: boolean;
  /** 缩略图的宽高比，默认 `4/3`。大图不裁切，按原比例整张显示 */
  ratio?: ImageViewerRatio;
  /** 缩略图按钮名称的开头，默认"查看大图" */
  viewLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  closeLabel?: string;
  /** 直接放 `ImageViewerItem` */
  children: ReactNode;
};

/**
 * 图片查看：一组缩略图，点一张放大到整屏看，前后翻。
 * 大图那一层在亮暗两个主题下都是深色；翻页用的是媒体轮播的那条轨道，触屏可以左右滑。
 *
 * `className` 和其余属性给缩略图的列表。
 */
export function ImageViewer({
  "aria-label": label,
  open: openProp,
  onOpenChange,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  loop = false,
  ratio = "4/3",
  viewLabel = "查看大图",
  previousLabel = "上一张",
  nextLabel = "下一张",
  closeLabel = "关闭",
  className,
  children,
  ...props
}: ImageViewerProps) {
  // 标题、说明和大图都从子元素上读，所以子元素必须直接是 ImageViewerItem
  const items = Children.toArray(children).filter((child) =>
    isValidElement<ItemLike>(child),
  ) as ReactElement<ItemLike>[];
  const count = items.length;
  const last = Math.max(0, count - 1);

  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  });
  const [rawIndex, setIndex] = useControllableState({
    value: indexProp,
    defaultValue: defaultIndex,
    onChange: onIndexChange,
  });
  const index = Math.min(Math.max(rawIndex, 0), last);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);

  const openAt = (position: number) => {
    setIndex(position);
    setOpen(true);
  };
  const register = (position: number, node: HTMLButtonElement | null) => {
    thumbs.current[position] = node;
  };

  return (
    <>
      <ul
        {...props}
        aria-label={label}
        data-ratio={ratio}
        className={cn(
          "grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 text-ink",
          className,
        )}
      >
        {items.map((item, position) => (
          <ItemContext
            key={position}
            value={{
              position,
              count,
              ratio,
              viewLabel,
              open: openAt,
              register,
            }}
          >
            {item}
          </ItemContext>
        ))}
      </ul>
      <BaseDialog.Root open={open} onOpenChange={(next) => setOpen(next)}>
        <BaseDialog.Portal>
          <BaseDialog.Viewport className="fixed inset-0 z-(--z-overlay)">
            <Stage
              label={label}
              items={items}
              index={index}
              setIndex={setIndex}
              loop={loop}
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              closeLabel={closeLabel}
              thumbs={thumbs}
              onClose={() => setOpen(false)}
            />
          </BaseDialog.Viewport>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </>
  );
}

type StageProps = {
  label: string;
  items: ReactElement<ItemLike>[];
  index: number;
  setIndex: (index: number) => void;
  loop: boolean;
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
  thumbs: RefObject<(HTMLButtonElement | null)[]>;
  onClose: () => void;
};

/** 大图层。只在打开的时候挂着：轨道一挂上就直接对到被点的那一张 */
function Stage({
  label,
  items,
  index,
  setIndex,
  loop,
  previousLabel,
  nextLabel,
  closeLabel,
  thumbs,
  onClose,
}: StageProps) {
  const count = items.length;
  const last = Math.max(0, count - 1);
  const { trackRef, onScroll } = useSnapTrack({
    index,
    count,
    onSettle: setIndex,
  });
  const popupRef = useRef<HTMLDivElement>(null);
  // 关的时候焦点回到哪张缩略图，要读那一刻的下标
  const indexRef = useRef(index);
  indexRef.current = index;

  const go = (next: number) => {
    if (count === 0) return;
    const target = loop
      ? (next + count) % count
      : Math.min(Math.max(next, 0), last);
    setIndex(target);
    // 到头了，刚按的那个翻页钮马上要禁用：把焦点交还给这一层，键盘还能接着用方向键翻回去
    if (
      !loop &&
      (target === 0 || target === last) &&
      document.activeElement instanceof HTMLButtonElement &&
      document.activeElement.hasAttribute("data-image-viewer-nav")
    ) {
      popupRef.current?.focus({ preventScroll: true });
    }
  };

  // 焦点在这一层的哪儿都能翻；视频自己的控件要用方向键，不抢
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    if ((event.target as Element).closest("video, audio, input, textarea")) {
      return;
    }
    const next = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    go(next);
  };

  const current = items[index]?.props;
  const many = count > 1;
  const captioned = Boolean(current?.title || current?.description);

  return (
    <BaseDialog.Popup
      // 两个主题下都是深色：里面的字、关闭钮、焦点环都按深色取值
      data-theme="dark"
      data-image-viewer=""
      ref={popupRef}
      // 打开时焦点落在这一层自己身上：方向键马上能用，Tab 再走到关闭钮和翻页钮。
      // 它不是一个能操作的东西，所以没有焦点环——不然整个舞台外面会套一圈
      initialFocus={popupRef}
      finalFocus={() => thumbs.current[indexRef.current] ?? true}
      onKeyDown={onKeyDown}
      className={cn(
        "flex size-full flex-col bg-surface text-ink outline-none",
        "transition-opacity duration-(--duration-fast) ease-standard",
        "data-ending-style:opacity-0 data-starting-style:opacity-0",
      )}
    >
      <div className={cn(overlayHeader, "h-14 px-4")}>
        <BaseDialog.Title className="sr-only">{label}</BaseDialog.Title>
        {many && (
          // 看得见的计数只给眼睛：同样的话下面的说明区会播报
          <span
            aria-hidden="true"
            data-count=""
            className="font-tech text-sm text-ink-secondary tabular-nums"
          >
            {`${index + 1} / ${count}`}
          </span>
        )}
        <BaseDialog.Close aria-label={closeLabel} className={overlayClose}>
          <Close size={24} />
        </BaseDialog.Close>
      </div>

      <Viewfinder size="md" className="min-h-0 flex-1">
        <div
          ref={trackRef}
          data-image-viewer-track=""
          onScroll={onScroll}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        >
          {items.map((item, position) => (
            <div
              key={position}
              role="group"
              aria-roledescription="幻灯片"
              aria-label={`第 ${position + 1} 张，共 ${count} 张`}
              // 不在眼前的：Tab 走不进去，读屏也读不到
              inert={position !== index}
              data-current={position === index ? "" : undefined}
              // 点图以外的空处就是关
              onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
              }}
              className={cn(
                "flex size-full shrink-0 snap-start items-center justify-center p-6 sm:p-10",
                // 图按原比例整张放进去：不裁切，也不放大过它自己的尺寸
                "*:max-h-full *:max-w-full [&>img]:object-contain [&>video]:object-contain",
              )}
            >
              {/* 只渲染当前这张和左右各一张：二十张图不会一打开就全去取 */}
              {Math.abs(position - index) <= 1 ? item.props.children : null}
            </div>
          ))}
        </div>
      </Viewfinder>

      {(many || captioned) && (
        <div className="flex shrink-0 flex-wrap items-start gap-x-6 gap-y-3 border-t border-line px-4 py-4">
          {many && (
            <div className="flex shrink-0 gap-2">
              <IconButton
                variant="floating"
                aria-label={previousLabel}
                data-image-viewer-nav=""
                disabled={!loop && index <= 0}
                onClick={() => go(index - 1)}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                variant="floating"
                aria-label={nextLabel}
                data-image-viewer-nav=""
                disabled={!loop && index >= last}
                onClick={() => go(index + 1)}
              >
                <ChevronRight />
              </IconButton>
            </div>
          )}
          <div
            aria-live="polite"
            className="flex min-w-0 flex-1 basis-48 flex-col gap-1"
          >
            {many && (
              <span className="sr-only">{`第 ${index + 1} 张，共 ${count} 张`}</span>
            )}
            {current?.title && (
              <p className="text-base font-bold wrap-anywhere">
                {current.title}
              </p>
            )}
            {current?.description && (
              <p className="max-h-24 overflow-y-auto text-sm wrap-anywhere text-ink-secondary">
                {current.description}
              </p>
            )}
          </div>
        </div>
      )}
    </BaseDialog.Popup>
  );
}

export type ImageViewerItemProps = Omit<
  ComponentProps<"li">,
  "title" | "aria-label"
> & {
  /** 这一张的标题，显示在大图下面；也用来给缩略图按钮起名 */
  title?: ReactNode;
  /** 标题下面的一段说明 */
  description?: ReactNode;
  /** 另给的小图，放在缩略图里。不传就用同一张图 */
  thumbnail?: ReactNode;
  /** 缩略图按钮的可访问名称。默认是"查看大图：标题"，没有文字标题时报第几张 */
  "aria-label"?: string;
  /** 图：一个 `<img>`（或 `<video>`）。大图层里按原比例整张显示 */
  children: ReactNode;
};

/** 图片查看里的一张。直接放在 `ImageViewer` 里。 */
export function ImageViewerItem({
  title,
  // 说明由 ImageViewer 读走，画在大图下面
  description: _description,
  thumbnail,
  "aria-label": ariaLabel,
  className,
  children,
  ...props
}: ImageViewerItemProps) {
  const item = useContext(ItemContext);
  if (!item) {
    throw new Error("ImageViewerItem 要直接放在 ImageViewer 里面");
  }

  const name =
    ariaLabel ??
    `${item.viewLabel}：${
      typeof title === "string"
        ? title
        : `第 ${item.position + 1} 张，共 ${item.count} 张`
    }`;

  return (
    <li {...props} className={cn("min-w-0", className)}>
      <button
        type="button"
        ref={(node) => item.register(item.position, node)}
        aria-label={name}
        aria-haspopup="dialog"
        onClick={() => item.open(item.position)}
        className={cn(
          "group/thumb relative block w-full overflow-clip rounded-md bg-surface-muted",
          "[&>img]:size-full [&>img]:object-cover [&>svg]:size-full [&>video]:size-full [&>video]:object-cover",
          focusRing,
          ratioClass[item.ratio],
        )}
      >
        {thumbnail ?? children}
        {/* 悬停：一条底边强调线从左充出，同媒体卡。不放大、不提亮 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-action transition-transform duration-(--duration-base) ease-standard group-hover/thumb:scale-x-100 group-focus-visible/thumb:scale-x-100"
        />
      </button>
    </li>
  );
}
