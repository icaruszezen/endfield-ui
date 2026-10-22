import { memo, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/core";
import {
  EMPTY_ITEM_ICON_LAYERS,
  ItemIcon,
  type ItemIconImageRenderer,
  type ItemIconLayers,
} from "../item-icon";

export type ItemCardKind = "weapon" | "item" | "enemy" | "";
export type ItemCardVariant = "banner" | "inventory";

export type ItemCardSelectionAction = {
  onSelect: () => void;
  ariaLabel?: string;
  selected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

export type ItemCardLinkProps = {
  href: string;
  children: ReactNode;
  className: string;
  "aria-label": string;
  "data-item-tooltip-id"?: string;
};

export type ItemCardLinkRenderer = (props: ItemCardLinkProps) => ReactNode;

export type ItemCardProps = {
  kind: ItemCardKind;
  name: string;
  imageUrl: string;
  rarity: number;
  itemId?: string;
  /** 实际链接地址；组件不转换 Wiki 文章标题。 */
  href?: string;
  variant?: ItemCardVariant;
  count?: number;
  showName?: boolean;
  className?: string;
  style?: CSSProperties;
  icon?: ItemIconLayers;
  action?: ItemCardSelectionAction;
  badges?: ReactNode;
  ariaLabel?: string;
  fallback?: ReactNode;
  renderImage?: ItemIconImageRenderer;
  renderLink?: ItemCardLinkRenderer;
  renderName?: (name: string) => ReactNode;
  renderCount?: (count: number) => ReactNode;
};

const KIND_LABEL = { weapon: "武器", item: "物品", enemy: "敌人" } as const;

function isItemKind(kind: ItemCardKind): kind is Exclude<ItemCardKind, ""> {
  return kind === "weapon" || kind === "item" || kind === "enemy";
}

function clampRarity(rarity: number) {
  return Math.min(Math.max(Math.trunc(rarity), 1), 6);
}

function nameFontSize(name: string) {
  let em = 0;
  for (const character of name) {
    em += (character.codePointAt(0) ?? 0) < 0x2e80 ? 0.5 : 1;
  }
  return em > 0 ? `clamp(9px, calc(100cqw / ${em}), 14px)` : undefined;
}

/** Wiki 物品卡片：名称横条或库存数量横条，共用完整图层图标。 */
export const ItemCard = /* @__PURE__ */ memo(function ItemCard({
  kind,
  name,
  imageUrl,
  rarity,
  itemId,
  href,
  variant = "banner",
  count = 0,
  showName = true,
  className,
  style,
  icon,
  action,
  badges,
  ariaLabel,
  fallback,
  renderImage,
  renderLink,
  renderName,
  renderCount,
}: ItemCardProps) {
  if (!isItemKind(kind)) return null;
  const hasRarity =
    Number.isFinite(rarity) && rarity > 0 && (icon?.iconShowRarity ?? true);
  const inventory = variant === "inventory";
  const layers: ItemIconLayers = {
    ...EMPTY_ITEM_ICON_LAYERS,
    ...icon,
    iconUrl: imageUrl,
  };
  const label = ariaLabel || name || KIND_LABEL[kind];
  const renderedName = renderName ? renderName(name) : name || "—";

  const tile = (
    <div className="ef-item-card-tile">
      <span aria-hidden="true" className="ef-item-card-background" />
      <div className="ef-item-card-art">
        <ItemIcon
          layers={layers}
          alt={name}
          className="ef-item-card-icon"
          renderImage={renderImage}
          fallback={
            fallback === undefined ? (
              <span className="ef-item-card-fallback">NO IMAGE</span>
            ) : (
              fallback
            )
          }
        />
      </div>
      {badges ? <div className="ef-item-card-badges">{badges}</div> : null}
      <div className="ef-item-card-strip">
        <span aria-hidden="true" className="ef-item-card-edge" />
        <div className="ef-item-card-strip-content">
          {inventory ? (
            <span className="ef-item-card-count">
              {renderCount ? renderCount(count) : count > 0 ? count : "\u00a0"}
            </span>
          ) : (
            <span
              className="ef-item-card-name"
              style={{ fontSize: nameFontSize(name) }}
              title={name}
            >
              {showName ? renderedName : "\u00a0"}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const inner = (
    <div
      className={cn("ef-item-card", className)}
      style={style}
      data-kind={kind}
      data-variant={variant}
      data-rarity={hasRarity ? clampRarity(rarity) : undefined}
      data-item-tooltip-id={
        !action && !href && kind === "item" ? itemId : undefined
      }
    >
      {tile}
      {inventory && showName && (
        <span className="ef-item-card-caption" title={name}>
          {renderedName}
        </span>
      )}
    </div>
  );

  if (action) {
    return (
      <button
        type="button"
        onClick={action.onSelect}
        disabled={action.disabled}
        aria-pressed={action.selected}
        aria-label={[action.ariaLabel || label, action.disabledReason]
          .filter(Boolean)
          .join(" · ")}
        className="ef-item-card-action"
        data-selected={action.selected ? "" : undefined}
      >
        {inner}
        {action.disabledReason && (
          <span className="ef-item-card-disabled-reason">
            {action.disabledReason}
          </span>
        )}
      </button>
    );
  }
  if (href) {
    const linkProps: ItemCardLinkProps = {
      href,
      children: inner,
      className: "ef-item-card-link",
      "aria-label": label,
      "data-item-tooltip-id": kind === "item" ? itemId : undefined,
    };
    return renderLink ? renderLink(linkProps) : <a {...linkProps} />;
  }
  return inner;
});
