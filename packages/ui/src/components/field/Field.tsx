import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { usePresence } from "../../hooks/usePresence";
import { StatusDanger } from "../../icons/StatusDanger";
import { cn } from "../../lib/cn";
import { collapse, collapseEnter, collapseInner } from "../../lib/motion";

type FieldContextValue = {
  /** 单个控件的 id；`group` 字段里有多个控件，不提供 */
  controlId: string | undefined;
  labelId: string;
  describedBy: string | undefined;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
  group: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

/** 给成组的控件（单选组）读取所在字段的状态。不在 `Field` 里时返回 `null`。 */
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

type ControlProps = {
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** 错误态。不传时跟随所在的 `Field` */
  invalid?: boolean;
  "aria-describedby"?: string;
};

/**
 * 把所在 `Field` 的 id、说明文字、错误态、禁用、必填并进控件自己的属性。
 * 控件上显式传的值优先。自定义控件用它接入 `Field`。
 */
export function useFieldControl({
  id,
  disabled,
  required,
  invalid,
  "aria-describedby": describedBy,
}: ControlProps) {
  const field = useContext(FieldContext);
  const mergedDescribedBy =
    [describedBy, field?.describedBy].filter(Boolean).join(" ") || undefined;

  return {
    id: id ?? field?.controlId,
    disabled: disabled ?? field?.disabled ?? false,
    required: required ?? field?.required ?? false,
    invalid: invalid ?? field?.invalid ?? false,
    "aria-describedby": mergedDescribedBy,
  };
}

export type FieldProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** 标签，在控件上方。不要用占位文字代替它 */
  label: ReactNode;
  /** 帮助文字，在控件下方 */
  help?: ReactNode;
  /** 错误说明：写"哪里不对、怎么改"。有值即为错误态 */
  error?: ReactNode;
  /** 必填：标签后加一个小菱形，并交给里面的控件 */
  required?: boolean;
  /** 禁用：标签变浅，并交给里面的控件 */
  disabled?: boolean;
  /**
   * 里面是一组控件（几个复选、一个单选组）而不是单个输入框时打开：
   * 渲染成 `<fieldset>` + `<legend>`。
   */
  group?: boolean;
  /** 单个控件的 id，缺省自动生成 */
  controlId?: string;
  children: ReactNode;
};

/** 表单字段：标签在上、控件在下，下面是帮助与错误文字，三者自动关联。 */
export function Field({
  label,
  help,
  error,
  required = false,
  disabled = false,
  group = false,
  controlId,
  className,
  children,
  ...props
}: FieldProps) {
  const baseId = useId();
  const id = controlId ?? `${baseId}-control`;
  const labelId = `${baseId}-label`;
  const helpId = `${baseId}-help`;
  const errorId = `${baseId}-error`;

  const hasError = error !== undefined && error !== null && error !== false;
  const hasHelp = help !== undefined && help !== null && help !== false;
  const describedBy =
    [hasError && errorId, hasHelp && helpId].filter(Boolean).join(" ") ||
    undefined;

  // 错误说明撤掉之后先收起、再卸载。收的时候 `error` 已经空了，画的是最后那一句
  const {
    ref: errorRef,
    mounted: errorMounted,
    leaving: errorLeaving,
    entered: errorEntered,
  } = usePresence<HTMLDivElement>(hasError);
  const [lastError, setLastError] = useState(error);
  if (hasError && !Object.is(lastError, error)) setLastError(error);

  const context = useMemo<FieldContextValue>(
    () => ({
      controlId: group ? undefined : id,
      labelId,
      describedBy,
      invalid: hasError,
      disabled,
      required,
      group,
    }),
    [group, id, labelId, describedBy, hasError, disabled, required],
  );

  const labelClass = cn(
    "block text-sm font-medium",
    disabled ? "text-ink-disabled" : "text-ink",
  );

  const labelContent = (
    <>
      {label}
      {required && (
        // 行动色在亮色表面上看不见，必填记号用强调色的文字档
        <span
          aria-hidden="true"
          data-required=""
          className={cn(
            "ml-1.5 inline-block size-1.5 rotate-45 align-middle",
            disabled ? "bg-ink-disabled" : "bg-accent-ink",
          )}
        />
      )}
    </>
  );

  const messages = (
    <>
      {errorMounted && (
        // 出现时按高度把下面的内容顶开并淡入，撤掉时反过来：下面的不会被"啪"地顶一下
        <div
          ref={errorRef}
          data-leaving={errorLeaving ? "" : undefined}
          // 正在收起的是已经撤掉的那一句，不再读给读屏
          aria-hidden={errorLeaving || undefined}
          className={cn(
            collapse,
            // 小件：高度和淡入淡出都是 200ms
            "transition-[grid-template-rows,opacity] duration-(--duration-fast) data-leaving:opacity-0",
            errorEntered && [collapseEnter, "starting:opacity-0"],
          )}
        >
          <div className={collapseInner}>
            {/* 和控件之间的 6px 写成内边距，跟着一起收 */}
            <p
              id={errorId}
              className="flex items-start gap-1.5 pt-1.5 text-sm text-danger"
            >
              <StatusDanger size={16} className="mt-0.5 shrink-0" />
              <span className="min-w-0 wrap-anywhere">
                {hasError ? error : lastError}
              </span>
            </p>
          </div>
        </div>
      )}
      {hasHelp && (
        <p
          id={helpId}
          className={cn(
            "mt-1.5 text-sm",
            disabled ? "text-ink-disabled" : "text-ink-secondary",
          )}
        >
          {help}
        </p>
      )}
    </>
  );

  if (group) {
    return (
      <fieldset
        {...props}
        disabled={disabled}
        aria-describedby={describedBy}
        data-invalid={hasError ? "" : undefined}
        className={cn("min-w-0", className)}
      >
        <legend id={labelId} className={cn(labelClass, "mb-1.5")}>
          {labelContent}
        </legend>
        {/* 组里的控件默认竖排；要横排就自己包一层，作为这里唯一的子元素 */}
        <div className="flex flex-col items-start">
          <FieldContext value={context}>{children}</FieldContext>
        </div>
        {messages}
      </fieldset>
    );
  }

  return (
    <div
      {...props}
      data-invalid={hasError ? "" : undefined}
      className={cn("min-w-0", className)}
    >
      <label id={labelId} htmlFor={id} className={cn(labelClass, "mb-1.5")}>
        {labelContent}
      </label>
      <FieldContext value={context}>{children}</FieldContext>
      {messages}
    </div>
  );
}
