import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { useMemo, useRef, type ReactNode, type Ref } from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { Close } from "../../icons/Close";
import { StatusDanger } from "../../icons/StatusDanger";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import { MenuCheck } from "../dropdown-menu/MenuCheck";
import {
  menuGroupLabel,
  menuItem,
  menuItemCurrent,
  menuItemHover,
  menuPanel,
  type MenuVariant,
} from "../dropdown-menu/menu-style";
import { useFieldControl } from "../field/Field";
import {
  controlBox,
  controlElement,
  controlIconSize,
  type ControlSize,
  type ControlVariant,
} from "../input/control-box";

export type ComboboxSize = ControlSize;
export type ComboboxVariant = ControlVariant;

export type ComboboxOption = {
  value: string;
  /** 显示的文字，也是检索的对象，所以必须是字符串 */
  label: string;
  /** 别名：检索时一并匹配，不显示。编号、缩写、旧称 */
  keywords?: readonly string[];
  disabled?: boolean;
};

export type ComboboxOptionGroup = {
  /** 分组的小标题 */
  label: string;
  items: readonly ComboboxOption[];
};

type ComboboxCommonProps = {
  /** 选项，或者 `{ label, items }` 的分组。分组和不分组的不要混着传 */
  items: readonly ComboboxOption[] | readonly ComboboxOptionGroup[];
  /** 没选时输入框里的提示 */
  placeholder?: string;
  /** 表单字段名：选中的值会随表单提交 */
  name?: string;
  /**
   * 外框的画法，和输入框相同：
   * - `sunken` 凹陷的底 + 一条底边线，默认；
   * - `outline` 四边描边，放在凹陷底色的区域里时用。
   */
  variant?: ComboboxVariant;
  /** 32 / 40 / 56px 高。多选时这是最小高度，已选项多了会长高 */
  size?: ComboboxSize;
  /**
   * 面板的画法：
   * - `plain` 跟随主题，默认；
   * - `strong` 固定的深色面板，当前项整行黄底墨字。
   */
  panelVariant?: MenuVariant;
  /** 一个都没匹配上时面板里的说明 */
  emptyText?: ReactNode;
  /** 清除钮的可访问名称 */
  clearLabel?: string;
  /** 右侧三角按钮的可访问名称 */
  toggleLabel?: string;
  /** 错误态。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 输入框里的文字变了：要自己去取选项（远程检索）时用 */
  onInputValueChange?: (text: string) => void;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** 给外框 */
  className?: string;
  /** 给里面的 `<input>` */
  ref?: Ref<HTMLInputElement>;
};

export type ComboboxSingleProps = ComboboxCommonProps & {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  /** 清除之后拿到的是 `null` */
  onValueChange?: (value: string | null) => void;
  removeLabel?: never;
};

export type ComboboxMultipleProps = ComboboxCommonProps & {
  /** 可以选多项：值是数组，已选项在框里排成一个个小块 */
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** 小块上删除叉的可访问名称，拿到的是这一项的文字。默认"移除某某" */
  removeLabel?: (label: string) => string;
};

export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

const isGrouped = (
  items: ComboboxCommonProps["items"],
): items is readonly ComboboxOptionGroup[] =>
  items.length > 0 && "items" in items[0]!;

/** 单行时是固定高度；多选会换行，所以只定最小高度 */
const boxSize: Record<ComboboxSize, { single: string; multiple: string }> = {
  sm: { single: "h-8 text-sm", multiple: "min-h-8 text-sm" },
  md: { single: "h-10 text-base", multiple: "min-h-10 text-base" },
  lg: { single: "h-14 text-lg", multiple: "min-h-14 text-lg" },
};

const chipSize: Record<ComboboxSize, string> = {
  sm: "h-5 text-xs",
  md: "h-6 text-sm",
  lg: "h-8 text-base",
};

/*
 * 焦点一直在输入框里，"移到了哪一项"只靠底色表示（没有焦点环可画）。
 * 当前项本来就有底色，被移到时再深一档，否则看不出来。
 */
const currentHighlighted: Record<MenuVariant, string> = {
  plain: "data-highlighted:bg-line",
  strong: "data-highlighted:bg-action-pressed",
};

const iconButton =
  "flex shrink-0 items-center justify-center self-stretch text-ink-secondary hover:text-ink disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:text-ink-disabled";

const byValue = (a: ComboboxOption | null, b: ComboboxOption | null) =>
  a?.value === b?.value;

/**
 * 组合框：一个能打字的下拉。选项多到要找的时候用它；只有几项时用 `Select`。
 * 值只能是选项里有的——它不是"带建议的输入框"。
 * 每个组合框都要有标签：放进 `Field`，或者自己传 `aria-label`。
 */
export function Combobox(props: ComboboxProps) {
  const {
    items,
    placeholder,
    name,
    variant = "sunken",
    size = "md",
    panelVariant = "plain",
    emptyText = "没有匹配的选项",
    clearLabel = "清除",
    toggleLabel = "展开选项",
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    open,
    defaultOpen,
    onOpenChange,
    onInputValueChange,
    id: idProp,
    "aria-label": ariaLabel,
    "aria-describedby": describedByProp,
    className,
    ref,
  } = props;
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });
  const boxRef = useRef<HTMLDivElement>(null);
  const { anchorRef, portalRef } = usePortalScope();
  const iconSize = controlIconSize[size];
  const multiple = props.multiple === true;
  const grouped = isGrouped(items);

  const options = useMemo(
    () => (isGrouped(items) ? items.flatMap((group) => group.items) : items),
    [items],
  );
  // 对外的值是字符串，基元要的是选项本身
  const find = (value: string | null | undefined) =>
    options.find((option) => option.value === value) ?? null;
  const findAll = (values: readonly string[]) =>
    options.filter((option) => values.includes(option.value));

  // 匹配文字和别名；不分大小写、不分全半角
  const { contains } = BaseCombobox.useFilter({ sensitivity: "base" });
  const filter = (option: ComboboxOption, query: string) =>
    contains(option.label, query) ||
    (option.keywords?.some((keyword) => contains(keyword, query)) ?? false);

  const renderOption = (option: ComboboxOption) => (
    <BaseCombobox.Item
      key={option.value}
      value={option}
      disabled={option.disabled}
      className={(state) =>
        cn(
          menuItem,
          multiple
            ? // 多选时会有好几项被选中：用行首的小方格表达，不铺整行的底色
              [menuItemHover, state.selected && "font-medium"]
            : state.selected
              ? [
                  menuItemCurrent[panelVariant],
                  currentHighlighted[panelVariant],
                ]
              : menuItemHover,
        )
      }
      render={
        multiple
          ? ({ children, ...itemProps }, state) => (
              <div {...itemProps}>
                <MenuCheck checked={state.selected} disabled={state.disabled} />
                {children}
              </div>
            )
          : undefined
      }
    >
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
    </BaseCombobox.Item>
  );

  const input = (hasValue: boolean) => (
    <BaseCombobox.Input
      ref={ref}
      id={id}
      // 多选时已经有小块了，就不再显示提示
      placeholder={hasValue ? undefined : placeholder}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      aria-describedby={field["aria-describedby"]}
      className={cn(
        controlElement,
        multiple ? "h-6 min-w-12 px-1" : "h-full pr-2 pl-3",
      )}
    />
  );

  const content = (
    <>
      <div
        ref={(node) => {
          boxRef.current = node;
          anchorRef(node);
        }}
        data-variant={variant}
        data-size={size}
        data-invalid={invalid ? "" : undefined}
        className={cn(
          controlBox({ variant, invalid, disabled, readOnly: false }),
          "items-center",
          boxSize[size][multiple ? "multiple" : "single"],
          className,
        )}
      >
        {props.multiple ? (
          <BaseCombobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-1 pl-2">
            <BaseCombobox.Value>
              {(selected: ComboboxOption[]) => (
                <>
                  {selected.map((option) => (
                    <BaseCombobox.Chip
                      key={option.value}
                      aria-label={option.label}
                      className={cn(
                        // 直角的小块：它是已经定下来的值，不是会自己变的状态
                        "flex max-w-full min-w-0 cursor-default items-center bg-surface-muted pl-2 text-ink",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                        "data-disabled:text-ink-disabled",
                        chipSize[size],
                      )}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      <BaseCombobox.ChipRemove
                        aria-label={(
                          props.removeLabel ?? ((label) => `移除${label}`)
                        )(option.label)}
                        className="flex aspect-square h-full shrink-0 items-center justify-center text-ink-secondary hover:bg-line hover:text-ink"
                      >
                        <Close size={12} />
                      </BaseCombobox.ChipRemove>
                    </BaseCombobox.Chip>
                  ))}
                  {input(selected.length > 0)}
                </>
              )}
            </BaseCombobox.Value>
          </BaseCombobox.Chips>
        ) : (
          input(false)
        )}
        {invalid && (
          <StatusDanger size={iconSize} className="shrink-0 text-danger" />
        )}
        <BaseCombobox.Clear
          aria-label={clearLabel}
          className={cn(iconButton, "w-7")}
        >
          <Close size={iconSize - 2} />
        </BaseCombobox.Clear>
        <BaseCombobox.Trigger
          aria-label={toggleLabel}
          className={cn(iconButton, "w-8 pr-1")}
        >
          <span className="flex rotate-90 transition-transform duration-(--duration-fast) ease-standard in-data-popup-open:-rotate-90">
            <TriangleRight size={iconSize - 4} />
          </span>
        </BaseCombobox.Trigger>
      </div>

      <BaseCombobox.Portal ref={portalRef}>
        <BaseCombobox.Positioner
          anchor={boxRef}
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-(--z-overlay) outline-none"
        >
          <BaseCombobox.Popup
            data-theme={panelVariant === "strong" ? "dark" : undefined}
            data-variant={panelVariant}
            className={cn(
              menuPanel,
              "max-w-(--available-width) min-w-(--anchor-width)",
            )}
          >
            <BaseCombobox.Empty className="px-3 py-2 text-sm text-ink-secondary empty:hidden">
              {emptyText}
            </BaseCombobox.Empty>
            <BaseCombobox.List className="max-h-[min(var(--available-height),20rem)] overflow-y-auto overscroll-contain empty:hidden">
              {grouped
                ? (group: ComboboxOptionGroup) => (
                    <BaseCombobox.Group key={group.label} items={group.items}>
                      <BaseCombobox.GroupLabel className={menuGroupLabel}>
                        {group.label}
                      </BaseCombobox.GroupLabel>
                      <BaseCombobox.Collection>
                        {renderOption}
                      </BaseCombobox.Collection>
                    </BaseCombobox.Group>
                  )
                : renderOption}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </>
  );

  const common = {
    items,
    filter,
    name,
    disabled,
    required,
    open,
    defaultOpen,
    onOpenChange: onOpenChange && ((next: boolean) => onOpenChange(next)),
    onInputValueChange:
      onInputValueChange && ((text: string) => onInputValueChange(text)),
    isItemEqualToValue: byValue,
  };

  if (props.multiple) {
    const { value, defaultValue, onValueChange } = props;
    return (
      <BaseCombobox.Root<ComboboxOption, true>
        {...common}
        multiple
        value={value && findAll(value)}
        defaultValue={defaultValue && findAll(defaultValue)}
        onValueChange={
          onValueChange &&
          ((next) => onValueChange(next.map((option) => option.value)))
        }
      >
        {content}
      </BaseCombobox.Root>
    );
  }

  const { value, defaultValue, onValueChange } = props;
  return (
    <BaseCombobox.Root<ComboboxOption>
      {...common}
      // 受控时没选就是 null；undefined 留给"不受控"
      value={value === undefined ? undefined : find(value)}
      defaultValue={defaultValue === undefined ? undefined : find(defaultValue)}
      onValueChange={
        onValueChange && ((next) => onValueChange(next?.value ?? null))
      }
    >
      {content}
    </BaseCombobox.Root>
  );
}
