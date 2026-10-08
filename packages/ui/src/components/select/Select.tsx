import { Select as BaseSelect } from "@base-ui/react/select";
import {
  createContext,
  Fragment,
  useContext,
  useRef,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";
import { usePortalScope } from "../../hooks/usePortalScope";
import { StatusDanger } from "../../icons/StatusDanger";
import { TriangleRight } from "../../icons/TriangleRight";
import { cn } from "../../lib/cn";
import {
  MenuVariantContext,
  menuGroupLabel,
  menuItem,
  menuItemCurrent,
  menuItemHover,
  menuPanel,
  menuSeparator,
  type MenuVariant,
} from "../dropdown-menu/menu-style";
import { MenuCheck } from "../dropdown-menu/MenuCheck";
import { useFieldControl } from "../field/Field";
import {
  controlBox,
  controlIconSize,
  controlSize,
  type ControlSize,
  type ControlVariant,
} from "../input/control-box";

export type SelectSize = ControlSize;
export type SelectVariant = ControlVariant;

export type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SelectCommonProps = {
  /**
   * 选项。只传它就够了；需要分组时改用子元素（`SelectGroup`、`SelectItem`），
   * 并仍然把全部选项传进来——触发器靠它在面板没打开时显示当前项的文字。
   */
  items: readonly SelectOption[];
  /** 没选时显示的文字 */
  placeholder?: ReactNode;
  /** 表单字段名：选中的值会随表单提交 */
  name?: string;
  /**
   * 触发器的画法，和输入框相同：
   * - `sunken` 凹陷的底 + 一条底边线，默认；
   * - `outline` 四边描边，放在凹陷底色的区域里时用。
   */
  variant?: SelectVariant;
  /** 32 / 40 / 56px 高 */
  size?: SelectSize;
  /**
   * 面板的画法：
   * - `plain` 跟随主题，默认；
   * - `strong` 固定的深色面板，当前项整行黄底墨字。
   */
  panelVariant?: MenuVariant;
  /** 错误态。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** 给触发器的外框 */
  className?: string;
  /** 给触发按钮 */
  ref?: Ref<HTMLButtonElement>;
  /** 自定义面板里的内容：`SelectItem`、`SelectGroup`、`SelectSeparator` */
  children?: ReactNode;
};

export type SelectSingleProps = SelectCommonProps & {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  renderValue?: never;
};

export type SelectMultipleProps = SelectCommonProps & {
  /** 可以选多项：值是数组，选项行首多一个小方格，选了不关面板 */
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /**
   * 自己画触发器里的内容，拿到的是已选的选项（按 `items` 的顺序）。
   * 默认把标签用顿号连起来，两项以上时后面跟一个计数。一项都没选时显示 `placeholder`
   */
  renderValue?: (selected: SelectOption[]) => ReactNode;
};

export type SelectProps = SelectSingleProps | SelectMultipleProps;

/** 面板里的选项要知道自己在不在多选的下拉里 */
const SelectMultipleContext = createContext(false);

function joinedLabels(selected: SelectOption[]) {
  return (
    <>
      <span className="min-w-0 truncate">
        {selected.map((option, index) => (
          <Fragment key={option.value}>
            {index > 0 && "、"}
            {option.label}
          </Fragment>
        ))}
      </span>
      {/* 名字放不下会被截断，计数不会：至少知道一共选了几项 */}
      {selected.length > 1 && (
        <span className="shrink-0 font-tech text-xs text-ink-secondary tabular-nums">
          {selected.length} 项
        </span>
      )}
    </>
  );
}

/**
 * 下拉选择：外观同输入框的触发器 + 一个落在它下方的面板。
 * 每个下拉都要有标签：放进 `Field`，或者自己传 `aria-label`。
 * 加 `multiple` 可以选多项，这时值是数组。
 * 选项只有两三个、又都该一眼看到时，用单选或页签，不用它。
 */
export function Select(props: SelectProps) {
  const {
    items,
    placeholder,
    name,
    variant = "sunken",
    size = "md",
    panelVariant = "plain",
    invalid: invalidProp,
    disabled: disabledProp,
    required: requiredProp,
    open,
    defaultOpen,
    onOpenChange,
    id: idProp,
    "aria-label": ariaLabel,
    "aria-describedby": describedByProp,
    className,
    ref,
    children,
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

  const common = {
    items,
    name,
    disabled,
    required,
    open,
    defaultOpen,
    onOpenChange: onOpenChange && ((next: boolean) => onOpenChange(next)),
  };

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
          // 面板开着的时候边线保持聚焦的墨色
          !disabled && !invalid && "has-data-popup-open:border-ink",
          controlSize[size],
          className,
        )}
      >
        <BaseSelect.Trigger
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={field["aria-describedby"]}
          className="flex h-full min-w-0 flex-1 cursor-default items-center gap-2 pr-3 pl-3 text-left outline-none disabled:cursor-not-allowed"
        >
          {props.multiple ? (
            <BaseSelect.Value className="flex min-w-0 flex-1 items-center gap-2 data-placeholder:text-ink-tertiary">
              {(values: string[]) => {
                const selected = items.filter((item) =>
                  values.includes(item.value),
                );
                if (selected.length === 0) {
                  return (
                    <span className="min-w-0 truncate">{placeholder}</span>
                  );
                }
                return (props.renderValue ?? joinedLabels)(selected);
              }}
            </BaseSelect.Value>
          ) : (
            <BaseSelect.Value
              placeholder={placeholder}
              className="min-w-0 flex-1 truncate data-placeholder:text-ink-tertiary"
            />
          )}
          {invalid && (
            <StatusDanger size={iconSize} className="shrink-0 text-danger" />
          )}
          <BaseSelect.Icon
            className={cn(
              "flex shrink-0 rotate-90 transition-transform duration-(--duration-fast) ease-standard data-popup-open:-rotate-90",
              disabled ? "text-ink-disabled" : "text-ink-secondary",
            )}
          >
            <TriangleRight size={iconSize - 4} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
      </div>

      <BaseSelect.Portal ref={portalRef}>
        <BaseSelect.Positioner
          anchor={boxRef}
          // 面板落在触发器下方，不盖在它上面
          alignItemWithTrigger={false}
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-(--z-overlay) outline-none"
        >
          <BaseSelect.Popup
            data-theme={panelVariant === "strong" ? "dark" : undefined}
            data-variant={panelVariant}
            className={cn(menuPanel, "min-w-(--anchor-width)")}
          >
            <BaseSelect.List className="max-h-[min(var(--available-height),20rem)] overflow-y-auto overscroll-contain">
              <MenuVariantContext value={panelVariant}>
                <SelectMultipleContext value={multiple}>
                  {children ??
                    items.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        disabled={item.disabled}
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                </SelectMultipleContext>
              </MenuVariantContext>
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </>
  );

  if (props.multiple) {
    const { value, defaultValue, onValueChange } = props;
    return (
      <BaseSelect.Root<string, true>
        {...common}
        multiple
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange && ((next) => onValueChange(next))}
      >
        {content}
      </BaseSelect.Root>
    );
  }

  const { value, defaultValue, onValueChange } = props;
  return (
    <BaseSelect.Root<string>
      {...common}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => {
        if (next !== null) onValueChange?.(next);
      }}
    >
      {content}
    </BaseSelect.Root>
  );
}

export type SelectItemProps = Omit<
  ComponentProps<"div">,
  "value" | "id" | "style"
> & {
  value: string;
  disabled?: boolean;
};

/** 面板里的一个选项。只在自定义面板内容时用。 */
export function SelectItem({
  value,
  disabled,
  className,
  children,
  ...props
}: SelectItemProps) {
  const variant = useContext(MenuVariantContext);
  const multiple = useContext(SelectMultipleContext);

  return (
    <BaseSelect.Item
      {...props}
      value={value}
      disabled={disabled}
      className={(state) =>
        cn(
          menuItem,
          multiple
            ? // 多选时会有好几项被选中：用行首的小方格表达，不铺整行的底色
              [menuItemHover, state.selected && "font-medium"]
            : state.selected
              ? menuItemCurrent[variant]
              : menuItemHover,
          className,
        )
      }
      render={
        multiple
          ? ({ children: content, ...itemProps }, state) => (
              <div {...itemProps}>
                <MenuCheck checked={state.selected} disabled={state.disabled} />
                {content}
              </div>
            )
          : undefined
      }
    >
      <BaseSelect.ItemText className="min-w-0 flex-1 truncate">
        {children}
      </BaseSelect.ItemText>
    </BaseSelect.Item>
  );
}

export type SelectGroupProps = Omit<ComponentProps<"div">, "style"> & {
  /** 分组的小标题 */
  label: ReactNode;
};

export function SelectGroup({
  label,
  className,
  children,
  ...props
}: SelectGroupProps) {
  return (
    <BaseSelect.Group {...props} className={className}>
      <BaseSelect.GroupLabel className={menuGroupLabel}>
        {label}
      </BaseSelect.GroupLabel>
      {children}
    </BaseSelect.Group>
  );
}

export type SelectSeparatorProps = Omit<ComponentProps<"div">, "style">;

export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <BaseSelect.Separator {...props} className={cn(menuSeparator, className)} />
  );
}
