import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = Omit<ComponentProps<"span">, "style"> & {
  /** 名字。没有图时显示它的首字；也是头像默认的可访问名称 */
  name?: string;
  /** 图片地址。没给、没加载出来、加载失败时显示首字 */
  src?: string;
  /**
   * 可访问名称，默认取 `name`。
   * 旁边已经写了名字时传 `""`：头像变成纯装饰，对读屏隐藏
   */
  alt?: string;
  /** 32 / 40 / 56 / 80px，默认 `md` */
  size?: AvatarSize;
  /** 选中：外面一圈行动色的环 */
  selected?: boolean;
  /** 没有图时显示的东西，代替首字（比如一个图标） */
  children?: ReactNode;
};

const sizeClass: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

/*
 * 选中环：2px 的间隔 + 3px 的行动色 + 1px 的墨线。
 * 墨线是给亮色页面的——黄色在白底上看不出来
 */
export const avatarSelectedRing =
  "shadow-[0_0_0_2px_var(--ef-surface),0_0_0_5px_var(--ef-action),0_0_0_6px_var(--ef-ink)]";

/** 中文名取第一个字；拉丁字母的名字取前两个词的首字母 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  // 展开是按码位拆的，取到的是完整的一个字；用下标取，生僻字会只拿到半个
  // oxlint-disable-next-line typescript/no-misused-spread
  const first = [...(words[0] ?? "")][0];
  if (!first) return "";
  if (!/[a-z]/i.test(first)) return first;
  // oxlint-disable-next-line typescript/no-misused-spread -- 同上
  const second = words.length > 1 ? ([...words[1]!][0] ?? "") : "";
  return (first + second).toUpperCase();
}

/** 头像：代表一个人或一个角色的圆形图。自己不能点。 */
export function Avatar({
  name,
  src,
  alt = name ?? "",
  size = "md",
  selected = false,
  className,
  children,
  ...props
}: AvatarProps) {
  const decorative = alt === "";

  return (
    <BaseAvatar.Root
      {...props}
      // 首字和图都只是这个名字的两种画法：整体是一张以名字命名的图
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": alt })}
      data-size={size}
      data-selected={selected ? "" : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-clip rounded-full bg-surface-muted font-medium text-ink-secondary select-none",
        sizeClass[size],
        selected && avatarSelectedRing,
        className,
      )}
    >
      {src && (
        <BaseAvatar.Image src={src} alt="" className="size-full object-cover" />
      )}
      <BaseAvatar.Fallback
        aria-hidden="true"
        className="flex size-full items-center justify-center leading-none [&_svg]:size-1/2"
      >
        {children ?? (name ? initialsOf(name) : null)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
