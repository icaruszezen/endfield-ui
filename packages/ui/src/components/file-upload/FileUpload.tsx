import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useControllableState } from "../../hooks/useControllableState";
import { StatusDanger } from "../../icons/StatusDanger";
import { Upload } from "../../icons/Upload";
import { cn } from "../../lib/cn";
import { decor } from "../../lib/decor";
import { formatFileSize, matchesAccept, sameFile } from "../../lib/file";
import { focusRingWithin } from "../../lib/focus-ring";
import { mergeRefs } from "../../lib/merge-refs";
import { useFieldControl } from "../field/Field";
import { FileItem } from "./FileItem";

export type FileUploadSize = "sm" | "md";

/** 没收的原因：类型不对、太大、个数超了 */
export type FileRejectReason = "type" | "size" | "count";
export type FileRejection = { file: File; reason: FileRejectReason };

/** 文件列表的名称、没收时的那几句话 */
export type FileUploadLabels = {
  /** 文件列表的可访问名称 */
  list: string;
  /** 选了几个：读屏的播报 */
  selected: (count: number) => string;
  /** 没收了几个：那一行说明的开头 */
  rejected: (count: number) => string;
  type: string;
  size: (limit: string) => string;
  count: (max: number) => string;
};

const defaultLabels: FileUploadLabels = {
  list: "已选的文件",
  selected: (count) => (count === 0 ? "没有文件" : `已选 ${count} 个文件`),
  rejected: (count) => `${count} 个文件没有加进来`,
  type: "类型不对",
  size: (limit) => `超过 ${limit}`,
  count: (max) => `超出个数上限（最多 ${max} 个）`,
};

export type FileUploadProps = {
  /** 受控的值 */
  value?: File[];
  /** 非受控时的初始值 */
  defaultValue?: File[];
  onValueChange?: (files: File[]) => void;
  /** 可以选几个。不开时新选的替掉原来的 */
  multiple?: boolean;
  /** 收哪些类型，写法和原生的一样：`.pdf,image/*` */
  accept?: string;
  /** 单个文件最大多少字节 */
  maxSize?: number;
  /** 最多几个（`multiple` 时） */
  maxFiles?: number;
  /** 有文件没收：拿到每个文件和原因 */
  onReject?: (rejections: FileRejection[]) => void;
  /** 表单字段名：列表里的文件随表单提交 */
  name?: string;
  /** 投放区的第一行字，后面跟着 `browseLabel` */
  title?: ReactNode;
  /** 带下划线的那几个字 */
  browseLabel?: ReactNode;
  /** 文件拖到上面时换成的字 */
  dropLabel?: ReactNode;
  /** 第二行：把限制写清楚——"PDF 或图片，单个不超过 10 MB" */
  description?: ReactNode;
  /** `md` 两行，默认；`sm` 是 40px 高的一行 */
  size?: FileUploadSize;
  /** 错误态。放在 `Field` 里时跟随它的 `error` */
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  /**
   * 自己画每个文件的那一行：选了就要传、要显示进度时用，返回一个带 `status` 的 `FileItem`。
   * 不传就是一行不带状态的 `FileItem`
   */
  renderFile?: (
    file: File,
    actions: { remove: () => void; index: number },
  ) => ReactNode;
  /** 移除钮的可访问名称，拿到的是文件名。默认"移除某某" */
  removeLabel?: (name: string) => string;
  /** 文件列表的名称、没收时的那几句话，换哪句传哪句 */
  labels?: Partial<FileUploadLabels>;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  /** 给最外面那一层 */
  className?: string;
  /** 给里面的 `<input type="file">` */
  ref?: Ref<HTMLInputElement>;
};

const zoneSize: Record<FileUploadSize, string> = {
  sm: "min-h-10 flex-wrap gap-x-3 px-3 py-2 text-sm",
  md: "gap-3 px-4 py-4",
};

/** 拖进来的东西里的文件；文件夹不收 */
function droppedFiles(transfer: DataTransfer): File[] {
  const items = [...(transfer.items ?? [])];
  if (items.length === 0) return [...transfer.files];
  return items.flatMap((item) => {
    if (item.kind !== "file") return [];
    if (item.webkitGetAsEntry?.()?.isDirectory) return [];
    return item.getAsFile() ?? [];
  });
}

/**
 * 文件上传：选文件，或者把文件拖进来。它只管"选"和"列"——发请求、算进度是使用方的事。
 *
 * 里面是一个真的 `<input type="file">`，铺满整个投放区：点哪儿都是打开系统的文件框。
 * 每个文件上传都要有标签：放进 `Field`，或者自己传 `aria-label`。
 */
export function FileUpload({
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  accept,
  maxSize,
  maxFiles,
  onReject,
  name,
  title = "把文件拖到这里，或者",
  browseLabel = "选择文件",
  dropLabel = "松开，放进来",
  description,
  size = "md",
  invalid: invalidProp,
  disabled: disabledProp,
  required: requiredProp,
  renderFile,
  removeLabel = (fileName) => `移除${fileName}`,
  labels: labelsProp,
  id: idProp,
  "aria-label": ariaLabel,
  "aria-describedby": describedByProp,
  className,
  ref,
}: FileUploadProps) {
  const { id, disabled, required, invalid, ...field } = useFieldControl({
    id: idProp,
    disabled: disabledProp,
    required: requiredProp,
    invalid: invalidProp,
    "aria-describedby": describedByProp,
  });
  const labels = { ...defaultLabels, ...labelsProp };
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [files, setFiles] = useControllableState<File[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  });
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [dragging, setDragging] = useState(false);
  // dragenter / dragleave 在每个子元素上都会来一次：数着，归零才算真的离开
  const depth = useRef(0);
  // 每加一次、删一次就把列表写回原生输入框一次（值没变也要写：它里面可能是刚被没收的那几个）
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || typeof DataTransfer === "undefined") return;
    try {
      const transfer = new DataTransfer();
      for (const file of files) transfer.items.add(file);
      input.files = transfer.files;
    } catch {
      // 写不回去的环境里（很老的浏览器）表单提交的是最后一次选的，列表照常显示
    }
  }, [files, revision]);

  // 移除之后焦点落到哪：等这一次渲染完
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    const index = pendingFocus.current;
    if (index === null) return;
    pendingFocus.current = null;
    const buttons =
      listRef.current?.querySelectorAll<HTMLElement>("[data-file-remove]") ??
      [];
    const target = buttons[Math.min(index, buttons.length - 1)];
    if (target) target.focus();
    else inputRef.current?.focus();
  });

  const add = (incoming: readonly File[]) => {
    const rejected: FileRejection[] = [];
    let next = multiple ? [...files] : [];
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) {
        rejected.push({ file, reason: "type" });
      } else if (maxSize !== undefined && file.size > maxSize) {
        rejected.push({ file, reason: "size" });
      } else if (!multiple) {
        // 只收一个：第一个合格的替掉原来的，再多的算超了
        if (next.length === 0) next = [file];
        else rejected.push({ file, reason: "count" });
      } else if (next.some((existing) => sameFile(existing, file))) {
        // 同一个文件不重复加，也不算错
      } else if (maxFiles !== undefined && next.length >= maxFiles) {
        rejected.push({ file, reason: "count" });
      } else {
        next.push(file);
      }
    }
    // 只收一个、这次又一个合格的都没有：原来的留着
    if (!multiple && next.length === 0) next = files;

    const changed =
      next.length !== files.length ||
      next.some((file, index) => file !== files[index]);
    if (changed) setFiles(next);
    setRejections(rejected);
    setRevision((current) => current + 1);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const remove = (index: number) => {
    pendingFocus.current = index;
    setFiles(files.filter((_, position) => position !== index));
    setRejections([]);
    setRevision((current) => current + 1);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    add([...(event.target.files ?? [])]);
  };

  const hasFiles = (event: DragEvent) =>
    [...event.dataTransfer.types].includes("Files");

  const handleDragEnter = (event: DragEvent) => {
    if (disabled || !hasFiles(event)) return;
    depth.current += 1;
    setDragging(true);
  };
  const handleDragLeave = (event: DragEvent) => {
    if (disabled || !hasFiles(event)) return;
    depth.current = Math.max(depth.current - 1, 0);
    if (depth.current === 0) setDragging(false);
  };
  const handleDragOver = (event: DragEvent) => {
    // 不拦下来浏览器不让放；禁用时也拦，免得整页跳去打开这个文件
    if (hasFiles(event)) event.preventDefault();
  };
  const handleDrop = (event: DragEvent) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (!disabled) add(droppedFiles(event.dataTransfer));
  };

  const reasonText = ({ reason }: FileRejection) => {
    if (reason === "type") return labels.type;
    if (reason === "size") return labels.size(formatFileSize(maxSize ?? 0));
    return labels.count(multiple ? (maxFiles ?? 0) : 1);
  };

  return (
    <div
      data-size={size}
      data-invalid={invalid ? "" : undefined}
      className={cn("flex min-w-0 flex-col gap-2 text-ink", className)}
    >
      <div
        data-dropzone=""
        data-dragging={dragging ? "" : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative flex items-center border bg-surface-sunken",
          "transition-colors duration-(--duration-fast) ease-standard",
          focusRingWithin,
          zoneSize[size],
          dragging
            ? // 文件拖到上面：线变成实线
              "border-solid border-ink"
            : [
                "border-dashed",
                disabled
                  ? "cursor-not-allowed border-line text-ink-disabled"
                  : invalid
                    ? "border-danger"
                    : "border-line-strong hover:border-ink-secondary",
              ],
        )}
      >
        <Upload
          size={size === "sm" ? 20 : 24}
          className={cn(
            "shrink-0",
            disabled ? "text-ink-disabled" : "text-ink-secondary",
          )}
        />
        <span
          className={cn(
            "flex min-w-0",
            size === "sm"
              ? "flex-1 flex-wrap items-baseline gap-x-3"
              : "flex-col gap-0.5",
          )}
        >
          <span className="font-medium">
            {dragging ? (
              dropLabel
            ) : (
              <>
                {title}
                <span className="ml-1 underline underline-offset-4">
                  {browseLabel}
                </span>
              </>
            )}
          </span>
          {description && (
            <span
              className={cn(
                "text-sm",
                disabled ? "text-ink-disabled" : "text-ink-secondary",
              )}
            >
              {description}
            </span>
          )}
        </span>

        {/* 拖到上面时的取景角：正在瞄准 */}
        {dragging && (
          <span
            aria-hidden="true"
            data-brackets=""
            className={cn(
              decor,
              "corner-brackets absolute inset-1.5 [--bracket-offset:0px]",
            )}
          />
        )}

        {/* 真的文件输入框，看不见，铺满投放区：点哪儿都是它 */}
        <input
          ref={mergeRefs(inputRef, ref)}
          id={id}
          type="file"
          name={name}
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={field["aria-describedby"]}
          // 不要浏览器自带的那句"未选择任何文件"的提示
          title=""
          onChange={handleChange}
          // 禁用时让开：拖放的事件要落到投放区上，由它拦下
          className="absolute inset-0 size-full cursor-[inherit] opacity-0 outline-none disabled:pointer-events-none"
        />
      </div>

      {/* 这一行是播报给读屏的状态区，元素本身要一直在 */}
      <div aria-live="polite" data-rejections="">
        {rejections.length > 0 && (
          <p className="flex items-start gap-1.5 text-sm text-danger">
            <StatusDanger size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0 wrap-anywhere">
              {`${labels.rejected(rejections.length)}：${rejections
                .map(
                  (rejection) =>
                    `${rejection.file.name} ${reasonText(rejection)}`,
                )
                .join("；")}`}
            </span>
          </p>
        )}
      </div>

      {files.length > 0 && (
        <ul
          ref={listRef}
          aria-label={labels.list}
          className="flex flex-col gap-1"
        >
          {files.map((file, index) => {
            const actions = { remove: () => remove(index), index };
            return (
              <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                {renderFile ? (
                  renderFile(file, actions)
                ) : (
                  <FileItem
                    name={file.name}
                    size={file.size}
                    disabled={disabled}
                    removeLabel={removeLabel(file.name)}
                    onRemove={actions.remove}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      <span aria-live="polite" className="sr-only">
        {labels.selected(files.length)}
      </span>
    </div>
  );
}
