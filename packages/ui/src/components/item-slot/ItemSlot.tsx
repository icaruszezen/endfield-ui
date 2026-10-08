import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { Crosshair } from "../../icons/Crosshair";
import { Lock } from "../../icons/Lock";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";
import { focusRing } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";

export type ItemSlotRarity = 1 | 2 | 3 | 4;
export type ItemSlotRatio = "1/1" | "4/5";

type OwnProps = {
  /** 物品名称。格子里只有图标，名称是给读屏的 */
  name: string;
  /** 完整的读屏文字。缺省由名称、数量、稀有度与各状态拼出来 */
  label?: string;
  /** 右下角的数量 */
  count?: ReactNode;
  /** 稀有度 1 – 4：底部一段向上消散的渐变，左缘另有同样个数的小菱形 */
  rarity?: ItemSlotRarity;
  /** 宽高比：正方形（默认）或 4:5 */
  ratio?: ItemSlotRatio;
  /** 选中：四角出现角括号 */
  selected?: boolean;
  /** 锁定：左下角一个锁，卡面不变灰 */
  locked?: boolean;
  /** 未获得（图鉴）：内容换成准星占位符 */
  unowned?: boolean;
  /** 新获得：左上角的黄签 */
  isNew?: boolean;
  /** 黄签上的字，默认 `NEW` */
  newLabel?: ReactNode;
  /** 右上角的小圆位：已装备者的头像 */
  badge?: ReactNode;
  /** 售罄 / 不可用：整卡压一层遮罩。传文字（"售罄"）会写在遮罩上 */
  unavailable?: boolean | ReactNode;
  /** 传了就整格渲染成链接 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  /** 传了（且没有 `href` 和 `render`）就整格渲染成按钮 */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  /** 图标或缩略图 */
  children?: ReactNode;
};

export type ItemSlotProps = Omit<ComponentProps<"div">, keyof OwnProps> &
  OwnProps;

/** 格子里那个可点击的元素带着它：`ItemGrid` 靠它找到能用方向键走到的格子 */
const slotControl = { "data-slot-control": "" };

const ratioClass: Record<ItemSlotRatio, string> = {
  "1/1": "aspect-square",
  "4/5": "aspect-4/5",
};

// 有意不随主题变：稀有度色阶是固定的角色色，这里只作渐变的填充
const rarityClass: Record<ItemSlotRarity, string> = {
  1: "from-rarity-1/55",
  2: "from-rarity-2/55",
  3: "from-rarity-3/55",
  4: "from-rarity-4/55",
};

/**
 * 物品格：矩阵里的一个格子——图标、数量、稀有度。
 * 整格只有一个可点击元素；宽度跟着所在的网格走，格子之间留 6 – 8px。
 *
 * `className` 与其余属性给最外层的盒子。角括号画在盒子之外 4px，
 * 所以网格容器不能贴着格子裁切。一组格子放进 `ItemGrid`，就能用方向键在里面走。
 */
export function ItemSlot({
  name,
  label,
  count,
  rarity,
  ratio = "1/1",
  selected = false,
  locked = false,
  unowned = false,
  isNew = false,
  newLabel = "NEW",
  badge,
  unavailable = false,
  href,
  target,
  rel,
  render,
  onClick,
  disabled = false,
  className,
  children,
  ...props
}: ItemSlotProps) {
  const isLink = href !== undefined || render !== undefined;
  const isButton = !isLink && onClick !== undefined;
  const interactive = (isLink || isButton) && !disabled;
  const hasCount = count !== undefined && count !== null && count !== false;
  const isUnavailable = unavailable !== false && unavailable !== null;
  const unavailableText =
    typeof unavailable === "boolean" ? undefined : unavailable;

  // 图标、数量、角标都是给眼睛看的；读屏拿到的是这一句完整的话
  const spoken =
    label ??
    [
      name,
      hasCount && typeof count !== "object" && `数量 ${count}`,
      rarity && `稀有度 ${rarity}`,
      isNew && "新获得",
      unowned && "未获得",
      locked && "已锁定",
      isUnavailable &&
        (typeof unavailableText === "string" ? unavailableText : "不可用"),
    ]
      .filter(Boolean)
      .join("，");

  const faceClass = cn(
    // 卡面自己裁切：渐变、遮罩、角标都不许越界。焦点环画在它外面，不受影响
    "absolute inset-0 block overflow-clip border border-line bg-surface-raised text-left text-ink",
    interactive && [
      "transition-colors duration-(--duration-fast) ease-standard hover:border-line-strong",
      focusRing,
      // 选中时让到角括号之外，两圈不重叠
      selected && "focus-visible:outline-offset-[6px]",
    ],
    disabled && "cursor-not-allowed",
    // 高对比模式下背景画的角括号不显示，换成一圈系统色的描边
    selected && "forced-colors:border-2 forced-colors:border-[Highlight]",
  );

  const face = (
    <>
      {rarity && (
        <span
          aria-hidden="true"
          className={cn(
            decor,
            "absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t to-transparent",
            rarityClass[rarity],
          )}
        />
      )}
      {rarity === 4 && (
        // 最高一档在渐变上叠细斜纹，同样向上消散
        <span
          aria-hidden="true"
          className={cn(
            decor,
            "hatch hatch-fine absolute inset-x-0 bottom-0 h-2/5 opacity-30 [mask-image:linear-gradient(to_top,black,transparent)]",
          )}
        />
      )}

      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center p-3"
      >
        {unowned ? (
          <Crosshair className="size-1/2 max-h-8 max-w-8 text-ink-tertiary" />
        ) : (
          children
        )}
      </span>

      {rarity && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1.5 flex -translate-y-1/2 flex-col gap-1"
        >
          {Array.from({ length: rarity }, (_, index) => (
            <span key={index} className="size-1 rotate-45 bg-ink-secondary" />
          ))}
        </span>
      )}

      {isNew && (
        <span
          aria-hidden="true"
          className="cut-br cut-sm absolute top-0 left-0 flex h-4 items-center bg-action pr-2.5 pl-1 font-tech text-micro font-bold text-on-action uppercase"
        >
          {newLabel}
        </span>
      )}

      {badge !== undefined && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 flex size-5 items-center justify-center overflow-clip rounded-full bg-surface-inverse text-micro font-bold text-ink-inverse"
        >
          {badge}
        </span>
      )}

      {locked && (
        <Lock size={14} className="absolute bottom-1 left-1 text-ink" />
      )}

      {hasCount && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 bottom-1 font-tech text-sm leading-none font-bold tabular-nums"
        >
          {count}
        </span>
      )}

      {isUnavailable && (
        <span
          aria-hidden="true"
          // 遮罩在两个主题下都是黑的，上面的字固定用白
          className="absolute inset-0 flex items-center justify-center bg-scrim text-xs font-medium text-neutral-0"
        >
          {unavailableText !== undefined && (
            // 字下面垫一小块近黑，不管底下的图标是什么都读得清
            <span className="bg-neutral-950/80 px-1.5 py-0.5">
              {unavailableText}
            </span>
          )}
        </span>
      )}

      <span className="sr-only">{spoken}</span>
    </>
  );

  let node: ReactNode;
  if (isLink) {
    node = (
      <LinkElement
        render={render}
        // 禁用的链接去掉 href，保留 link 角色，让读屏仍能读出"不可用"
        href={disabled ? undefined : href}
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        target={target}
        rel={rel}
        aria-current={selected ? "true" : undefined}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        className={faceClass}
        {...slotControl}
      >
        {face}
      </LinkElement>
    );
  } else if (isButton) {
    node = (
      <button
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        onClick={onClick}
        className={faceClass}
        {...slotControl}
      >
        {face}
      </button>
    );
  } else {
    node = <div className={faceClass}>{face}</div>;
  }

  return (
    <div
      {...props}
      data-selected={selected ? "" : undefined}
      data-rarity={rarity}
      className={cn(
        "relative",
        ratioClass[ratio],
        selected && "corner-brackets",
        className,
      )}
    >
      {node}
    </div>
  );
}
