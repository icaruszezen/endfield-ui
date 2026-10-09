import type { ComponentProps, ReactNode } from "react";
import { Close } from "../../icons/Close";
import { StatusDanger } from "../../icons/StatusDanger";
import { StatusSuccess } from "../../icons/StatusSuccess";
import { cn } from "../../lib/cn";
import { fileExtension, formatFileSize } from "../../lib/file";
import { focusRing, focusRingInset } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { Progress } from "../progress/Progress";
import { Tag } from "../tag/Tag";

export type FileItemStatus = "uploading" | "done" | "error";

type OwnProps = {
  /** 文件名。前面的扩展名标签是从它里面取的 */
  name: string;
  /** 大小，字节 */
  size?: number;
  /**
   * 传到哪一步了，由使用方给：
   * - 不传：只是列出来；
   * - `uploading` 行底一条进度条，大小的位置换成百分比；
   * - `done` 多一个成功图标；
   * - `error` 文件名下面一行错误说明。
   */
  status?: FileItemStatus;
  /** `uploading` 时的进度，0 – 100。不传就是不确定进度 */
  progress?: number;
  /** `error` 时的说明：写"怎么了、怎么办" */
  error?: ReactNode;
  /** 传了右端就有移除钮 */
  onRemove?: () => void;
  /** 传了、且是 `error` 时，多一个"重试" */
  onRetry?: () => void;
  /** 移除钮的可访问名称，默认"移除某某" */
  removeLabel?: string;
  /** "重试"两个字 */
  retryLabel?: ReactNode;
  /** `done` 时读屏多听到的一句，默认"已上传" */
  doneLabel?: string;
  /** 进度条的可访问名称，默认"某某的上传进度" */
  progressLabel?: string;
  /** 传了文件名就是链接：已有的附件可以点开 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替 `<a>`（路由库的链接组件）。传了就按链接处理 */
  render?: LinkRender;
  disabled?: boolean;
};

export type FileItemProps = OwnProps &
  Omit<ComponentProps<"div">, keyof OwnProps | "children">;

/**
 * 一个文件一行：扩展名、文件名、大小、状态、移除钮。
 * `FileUpload` 里每个文件默认渲染一行；也可以单独拿去列"已有的附件"。
 */
export function FileItem({
  name,
  size,
  status,
  progress,
  error,
  onRemove,
  onRetry,
  removeLabel = `移除${name}`,
  retryLabel = "重试",
  doneLabel = "已上传",
  progressLabel = `${name}的上传进度`,
  href,
  target,
  rel,
  render,
  disabled = false,
  className,
  ...props
}: FileItemProps) {
  const uploading = status === "uploading";
  const failed = status === "error";
  const isLink = href !== undefined || render !== undefined;

  let meta: string | null = null;
  if (uploading && progress !== undefined) {
    meta = `${Math.round(Math.min(Math.max(progress, 0), 100))}%`;
  } else if (!uploading && size !== undefined) {
    meta = formatFileSize(size);
  }

  return (
    <div
      {...props}
      data-status={status}
      className={cn(
        "relative flex min-h-10 items-center gap-3 bg-surface-muted pl-2 text-sm",
        disabled ? "text-ink-disabled" : "text-ink",
        !onRemove && "pr-3",
        className,
      )}
    >
      <Tag
        // 禁用的那一行，扩展名也跟着降下去
        variant={disabled ? "muted" : "inverse"}
        size="sm"
        aria-hidden="true"
        data-extension=""
        className={cn(
          "min-w-10 justify-center font-tech font-bold",
          disabled && "text-ink-disabled",
        )}
      >
        {fileExtension(name) || "FILE"}
      </Tag>

      <span className="flex min-w-0 flex-1 flex-col py-1.5">
        {isLink ? (
          <LinkElement
            render={render}
            href={href}
            target={target}
            rel={rel}
            title={name}
            className={cn("truncate underline underline-offset-4", focusRing)}
          >
            {name}
          </LinkElement>
        ) : (
          <span title={name} className="truncate">
            {name}
          </span>
        )}
        {failed && error && (
          <span className="flex items-start gap-1 text-xs text-danger">
            <StatusDanger size={12} className="mt-0.5 shrink-0" />
            <span className="min-w-0 wrap-anywhere">{error}</span>
          </span>
        )}
      </span>

      {meta !== null && (
        <span
          data-meta=""
          className={cn(
            "shrink-0 font-tech text-xs tabular-nums",
            disabled ? "text-ink-disabled" : "text-ink-secondary",
          )}
        >
          {meta}
        </span>
      )}
      {status === "done" && (
        <>
          <StatusSuccess size={16} className="shrink-0 text-success" />
          <span className="sr-only">{doneLabel}</span>
        </>
      )}
      {failed && onRetry && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRetry}
          className={cn(
            "shrink-0 font-medium underline underline-offset-4",
            focusRing,
          )}
        >
          {retryLabel}
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          data-file-remove=""
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center self-center",
            "transition-colors duration-(--duration-fast) ease-standard",
            disabled
              ? "cursor-not-allowed text-ink-disabled"
              : "text-ink-secondary hover:bg-line hover:text-ink",
            // 这一行和上下两行只隔 4px，环画在里面
            focusRingInset,
          )}
        >
          <Close size={14} />
        </button>
      )}

      {uploading && (
        <Progress
          size="sm"
          value={progress}
          aria-label={progressLabel}
          className="absolute inset-x-0 bottom-0"
        />
      )}
    </div>
  );
}
