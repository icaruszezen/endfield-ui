import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { focusRingWithin } from "../../lib/focus-ring";
import { LinkElement, type LinkRender } from "../link-element/LinkElement";
import { PlayMark } from "../play-button/PlayButton";

export type MediaCardRatio = "16/9" | "4/3" | "1/1" | "3/4";

export type MediaCardProps = Omit<ComponentProps<"article">, "title"> & {
  /** 图片、视频封面或任意占位图形，铺满媒体区 */
  media: ReactNode;
  /** 媒体区的宽高比 */
  ratio?: MediaCardRatio;
  title: ReactNode;
  /** 微标行里的类目，组件在前面加 `//` */
  category?: ReactNode;
  /** 微标行里的日期 */
  date?: ReactNode;
  /** 类型标签（如 `PV`），放在图片下方的微标行里，不叠在图上 */
  tag?: ReactNode;
  /** 这张卡是一段影像：媒体区左下角多一个播放记号。记号不能点，整卡仍然只有一个链接 */
  video?: boolean;
  /** `video` 时加在标题前、读屏才听得到的那个词，默认"视频" */
  videoLabel?: string;
  /** 传了就整卡可点：标题是链接，点击范围铺满整张卡 */
  href?: string;
  target?: string;
  rel?: string;
  /** 用这个元素代替标题里的 `<a>`（路由库的链接组件）。传了整卡同样可点 */
  render?: LinkRender;
  /** 标题的层级，默认 `h3` */
  level?: 2 | 3 | 4 | 5 | 6;
};

const ratioClass: Record<MediaCardRatio, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-4/3",
  "1/1": "aspect-square",
  "3/4": "aspect-3/4",
};

/**
 * 媒体卡：图片 + 微标行 + 标题。标题和标签都在图片之外。
 * 整卡只有一个可点击元素，不要在里面再放按钮或链接。
 */
export function MediaCard({
  media,
  ratio = "16/9",
  title,
  category,
  date,
  tag,
  video = false,
  videoLabel = "视频",
  href,
  target,
  rel,
  render,
  level = 3,
  className,
  ...props
}: MediaCardProps) {
  const Heading = `h${level}` as const;
  const isLink = href !== undefined || render !== undefined;
  const hasCategory = category !== undefined && category !== null;
  const hasDate = date !== undefined && date !== null;
  const hasMeta = hasCategory || hasDate;
  // 播放记号是画给眼睛看的；读屏在标题前听到同一件事
  const heading = video ? (
    <>
      <span className="sr-only">{`${videoLabel}：`}</span>
      {title}
    </>
  ) : (
    title
  );

  return (
    <article
      {...props}
      className={cn(
        "group/card relative flex min-w-0 flex-col text-ink",
        isLink && focusRingWithin,
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-clip rounded-md bg-surface-muted",
          "[&>img]:size-full [&>img]:object-cover [&>svg]:size-full [&>video]:size-full [&>video]:object-cover",
          ratioClass[ratio],
        )}
      >
        {media}
        {video && (
          // 内缩 8px：不贴着圆角，也不挡底边那条悬停线
          <PlayMark className="pointer-events-none absolute bottom-2 left-2" />
        )}
        {isLink && (
          // 悬停：一条底边强调线从左充出。不放大、不上浮
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-action transition-transform duration-(--duration-base) ease-standard group-hover/card:scale-x-100 group-has-focus-visible/card:scale-x-100"
          />
        )}
      </div>
      {(tag !== undefined || hasMeta) && (
        // 行高按类型标签的高度留足：一排卡片里有的带标签、有的不带，标题仍然对齐
        <p className="mt-3 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-secondary">
          {tag}
          {hasMeta && (
            <span className="font-tech">
              <span aria-hidden="true">{"// "}</span>
              {category}
              {hasCategory && hasDate && "　"}
              {date}
            </span>
          )}
        </p>
      )}
      <Heading className="mt-1.5 text-base font-medium wrap-anywhere">
        {isLink ? (
          <LinkElement
            render={render}
            href={href}
            target={target}
            rel={rel}
            // 焦点环画在整张卡上；点击范围用伪元素铺满整张卡
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {heading}
          </LinkElement>
        ) : (
          heading
        )}
      </Heading>
    </article>
  );
}
