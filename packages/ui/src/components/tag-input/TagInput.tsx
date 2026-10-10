import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useAddedKeys } from "../../hooks/useAddedKeys";
import { useControllableState } from "../../hooks/useControllableState";
import { Close } from "../../icons/Close";
import { StatusDanger } from "../../icons/StatusDanger";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";
import { fadeInFast } from "../../lib/motion";
import { useFieldControl } from "../field/Field";
import {
  controlBox,
  controlElement,
  controlIconSize,
  type ControlSize,
  type ControlVariant,
} from "../input/control-box";
import {
  multiValueBox,
  valueChip,
  valueChipRemove,
  valueChipSize,
  valueInputHeight,
} from "../input/value-chip";

export type TagInputSize = ControlSize;
export type TagInputVariant = ControlVariant;

/** 没加成的原因：已经有了、到了上限、没过 `validate` */
export type TagInputRejectReason = "duplicate" | "max" | "invalid";

/** 读屏听到的那几句话 */
export type TagInputLabels = {
  /** 框里现在有哪些，作为输入框的补充说明 */
  summary: (tags: readonly string[]) => string;
  added: (tag: string) => string;
  removed: (tag: string) => string;
  duplicate: (tag: string) => string;
  max: (max: number) => string;
};

const defaultLabels: TagInputLabels = {
  summary: (tags) =>
    tags.length === 0
      ? "还没有标签"
      : `已有 ${tags.length} 个标签：${tags.join("、")}`,
  added: (tag) => `已添加${tag}`,
  removed: (tag) => `已移除${tag}`,
  duplicate: (tag) => `已经有${tag}了`,
  max: (max) => `最多 ${max} 个`,
};

type OwnProps = {
  /** 受控的值 */
  value?: string[];
  /** 非受控时的初始值 */
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** 表单字段名：每个标签一个同名的隐藏字段 */
  name?: string;
  /** 最多几个。传了右端会出现一个计数 */
  max?: number;
  /**
   * 这个词能不能加。返回一句话就是不让加，这句话会交给 `onReject`；
   * 返回空的就是可以
   */
  validate?: (
    text: string,
    current: readonly string[],
  ) => string | null | undefined | false;
  /** 打出这些字符就提交。默认是半角和全角的逗号；回车总是提交 */
  separators?: readonly string[];
  /** 离开输入框时把没提交的字也加进去，默认开 */
  commitOnBlur?: boolean;
  /** 一个词没加成：已经有了、到了上限、没过 `validate`（这时第三个参数是那句话） */
  onReject?: (
    text: string,
    reason: TagInputRejectReason,
    message?: string,
  ) => void;
  /**
   * 外框的画法，和输入框相同：
   * - `sunken` 凹陷的底 + 一条底边线，默认；
   * - `outline` 四边描边，放在凹陷底色的区域里时用。
   */
  variant?: TagInputVariant;
  /** 32 / 40 / 56px：这是最小高度，标签多了会换行、外框长高 */
  size?: TagInputSize;
  /** 错误态。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  /** 小块上删除叉的可访问名称，拿到的是这个标签。默认"移除某某" */
  removeLabel?: (tag: string) => string;
  /** 读屏听到的那几句话，换哪句传哪句 */
  labels?: Partial<TagInputLabels>;
  /** 给外框 */
  className?: string;
};

export type TagInputProps = OwnProps &
  Omit<
    ComponentProps<"input">,
    keyof OwnProps | "defaultValue" | "max" | "size" | "type" | "value"
  >;

const DEFAULT_SEPARATORS = [",", "，"] as const;

/*
 * 右端的错误图标和计数贴着最后一行：这一格的高度是外框的最小高度减去 2px 的边线，
 * 只有一行时它正好居中，小块换了行它留在底下（和多行文本的计数同一个位置）
 */
const trailingRow: Record<TagInputSize, string> = {
  sm: "h-[30px]",
  md: "h-[38px]",
  lg: "h-[54px]",
};

/** 重复的那个小块闪多久 */
const FLASH_MS = 400;

/**
 * 标签输入：自己打出来的一串短词。回车或者打出分隔符就加一个，粘贴一串会拆开。
 * 要从现成的选项里挑，用 `Combobox` 的 `multiple`。
 *
 * `className` 给外框，其余属性与 `ref` 给里面的 `<input>`。
 * 每个标签输入都要有标签：放进 `Field`，或者自己传 `aria-label`。
 */
export function TagInput({
  value,
  defaultValue,
  onValueChange,
  name,
  max,
  validate,
  separators = DEFAULT_SEPARATORS,
  commitOnBlur = true,
  onReject,
  variant = "sunken",
  size = "md",
  invalid: invalidProp,
  removeLabel = (tag) => `移除${tag}`,
  labels: labelsProp,
  id: idProp,
  disabled: disabledProp,
  required: requiredProp,
  readOnly = false,
  placeholder,
  "aria-describedby": describedByProp,
  className,
  ref,
  onKeyDown,
  onBlur,
  onPaste,
  onCompositionEnd,
  ...props
}: TagInputProps) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });
  const labels = { ...defaultLabels, ...labelsProp };
  const summaryId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [tags, setTags] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  });
  const [text, setText] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const full = max !== undefined && tags.length >= max;
  // 后来加的那几个淡入；一开始就有的是静止的
  const added = useAddedKeys(tags);

  useEffect(() => {
    if (flash === null) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  // 删掉一个之后焦点落到哪：等这一次渲染完，旁边那个小块才是"旁边那个"
  const pendingFocus = useRef<number | "input" | null>(null);
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    if (target === "input") inputRef.current?.focus();
    else focusChip(target);
  });

  const chipButtons = () =>
    boxRef.current?.querySelectorAll<HTMLButtonElement>("[data-tag] button") ??
    [];
  const focusChip = (index: number) => {
    const buttons = chipButtons();
    const button = buttons[Math.min(index, buttons.length - 1)];
    if (button) button.focus();
    else inputRef.current?.focus();
  };

  const splitter = useMemo(() => {
    const escaped = [...separators, "\n", "\r"].map((separator) =>
      separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    return new RegExp(escaped.join("|"));
  }, [separators]);

  /**
   * 把几个词加进去。返回该留在框里的字：只提交了一个词、它又没加成时留着，方便改；
   * 一次提交好几个（粘贴）时不留
   */
  const commit = (pieces: readonly string[]) => {
    const words = pieces.map((piece) => piece.trim()).filter(Boolean);
    let next = tags;
    let said = "";
    let kept = "";
    for (const word of words) {
      let reason: TagInputRejectReason | null = null;
      let problem: string | undefined;
      if (next.includes(word)) {
        reason = "duplicate";
        said = labels.duplicate(word);
        setFlash(word);
      } else if (max !== undefined && next.length >= max) {
        reason = "max";
        said = labels.max(max);
      } else {
        const verdict = validate?.(word, next);
        if (verdict) {
          reason = "invalid";
          problem = verdict;
          said = verdict;
        }
      }

      if (reason === null) {
        next = [...next, word];
        said = labels.added(word);
      } else {
        onReject?.(word, reason, problem);
        if (words.length === 1) kept = word;
      }
    }
    if (next !== tags) setTags(next);
    if (said) setMessage(said);
    return kept;
  };

  const remove = (index: number, focus: number | "input") => {
    const tag = tags[index];
    if (tag === undefined) return;
    pendingFocus.current = focus;
    setTags(tags.filter((_, position) => position !== index));
    setMessage(labels.removed(tag));
  };

  /** 框里的字变了：里面有分隔符就拆开提交。不看按的是哪个键——输入法、粘贴走的都是这里 */
  const take = (next: string) => {
    if (!splitter.test(next)) {
      setText(next);
      return;
    }
    setText(commit(next.split(splitter)));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // 输入法还在组字：拼音里的逗号、候选词都还不算数，等它组完
    if ((event.nativeEvent as InputEvent).isComposing) {
      setText(event.target.value);
      return;
    }
    take(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || readOnly) return;
    // 输入法正在组字时的回车是在选字，不是提交
    // oxlint-disable-next-line typescript/no-deprecated -- Safari 上确认选字的那一下回车，isComposing 已经是 false，只有 keyCode 还是 229
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const input = event.currentTarget;

    if (event.key === "Enter") {
      // 框里空着的回车留给表单：该提交就提交
      if (text.trim() === "") return;
      event.preventDefault();
      setText(commit([text]));
      return;
    }

    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    if (event.key === "Backspace" && text === "" && tags.length > 0) {
      event.preventDefault();
      remove(tags.length - 1, "input");
    } else if (event.key === "ArrowLeft" && atStart && tags.length > 0) {
      event.preventDefault();
      focusChip(tags.length - 1);
    }
  };

  const handleChipKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        if (index > 0) focusChip(index - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (index < tags.length - 1) focusChip(index + 1);
        else inputRef.current?.focus();
        break;
      case "Backspace":
      case "Delete":
        event.preventDefault();
        // 删掉之后这个位置上是原来的下一个；它是最后一个时落到前一个上
        remove(index, tags.length === 1 ? "input" : index);
        break;
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented || readOnly) return;
    const pasted = event.clipboardData.getData("text");
    // 单行输入框会把换行吃掉：带换行或分隔符的自己拆
    if (!splitter.test(pasted)) return;
    event.preventDefault();
    const input = event.currentTarget;
    const before = text.slice(0, input.selectionStart ?? text.length);
    const after = text.slice(input.selectionEnd ?? text.length);
    setText(commit(`${before}${pasted}${after}`.split(splitter)));
  };

  const editable = !disabled && !readOnly;

  return (
    <div
      ref={boxRef}
      data-variant={variant}
      data-size={size}
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      // 点框里空着的地方也是点输入框
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if ((event.target as Element).closest("button, input")) return;
        event.preventDefault();
        inputRef.current?.focus();
      }}
      className={cn(
        controlBox({ variant, invalid, disabled, readOnly }),
        "items-center",
        multiValueBox[size],
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-1 pl-2">
        {tags.map((tag, index) => (
          <span
            key={tag}
            data-tag=""
            data-flash={flash === tag ? "" : undefined}
            className={cn(
              valueChip,
              valueChipSize[size],
              "transition-colors duration-(--duration-fast) ease-standard",
              // 重复时闪一下：填充反转。不用黄色——这不是"选中"
              "data-flash:bg-surface-inverse data-flash:text-ink-inverse",
              added.has(tag) && fadeInFast,
              disabled && "text-ink-disabled",
              !editable && "pr-2",
            )}
          >
            <span className="min-w-0 truncate">{tag}</span>
            {editable && (
              <button
                type="button"
                // 整个控件只占一个 Tab 停靠点：小块用方向键走
                tabIndex={-1}
                aria-label={removeLabel(tag)}
                onClick={(event) =>
                  // 键盘触发的（回车、空格）焦点留在小块这一排；鼠标点的回到输入框
                  remove(
                    index,
                    event.detail === 0 && tags.length > 1 ? index : "input",
                  )
                }
                onKeyDown={(event) => handleChipKeyDown(event, index)}
                className={cn(
                  valueChipRemove,
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                  flash === tag && "text-ink-inverse",
                )}
              >
                <Close size={12} />
              </button>
            )}
          </span>
        ))}
        <input
          {...props}
          ref={mergeRefs(inputRef, ref)}
          id={id}
          type="text"
          value={text}
          disabled={disabled}
          readOnly={readOnly}
          // 已经有标签了就不算"没填"
          required={required && tags.length === 0}
          aria-required={required || undefined}
          // 已经有小块了，就不再显示提示
          placeholder={tags.length === 0 ? placeholder : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={
            [summaryId, field["aria-describedby"]].filter(Boolean).join(" ") ||
            undefined
          }
          autoComplete="off"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionEnd={(event) => {
            onCompositionEnd?.(event);
            // 组完了：这时框里的字才算数
            take(event.currentTarget.value);
          }}
          onBlur={(event) => {
            onBlur?.(event);
            if (commitOnBlur && editable && text.trim() !== "") {
              setText(commit([text]));
            }
          }}
          className={cn(
            controlElement,
            "min-w-12 px-1",
            valueInputHeight[size],
          )}
        />
      </div>
      {(invalid || max !== undefined) && (
        <span
          className={cn(
            "flex shrink-0 items-center gap-2 self-end pr-3 pl-1",
            trailingRow[size],
          )}
        >
          {invalid && (
            <StatusDanger
              size={controlIconSize[size]}
              className="shrink-0 text-danger"
            />
          )}
          {max !== undefined && (
            <span
              aria-hidden="true"
              data-count=""
              className={cn(
                "font-tech text-xs tabular-nums",
                disabled
                  ? "text-ink-disabled"
                  : full
                    ? "text-ink"
                    : "text-ink-secondary",
              )}
            >
              {`${tags.length} / ${max}`}
            </span>
          )}
        </span>
      )}

      <span id={summaryId} className="sr-only">
        {labels.summary(tags)}
      </span>
      <span aria-live="polite" className="sr-only">
        {message}
      </span>
      {name !== undefined &&
        tags.map((tag) => (
          <input
            key={tag}
            type="hidden"
            name={name}
            value={tag}
            disabled={disabled}
          />
        ))}
    </div>
  );
}
