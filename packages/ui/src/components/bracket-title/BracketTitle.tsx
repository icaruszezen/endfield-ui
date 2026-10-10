import type { ComponentProps, ElementType, ReactNode } from "react";
import { useInView } from "../../hooks/useInView";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export type BracketTitleProps = Omit<ComponentProps<"h3">, "children"> & {
  /** 标题层级，默认 3（`<h3>`） */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** 进入视口时播放一次入场：括号先到，名称随后。默认开启 */
  animate?: boolean;
  /** 名称 */
  children: ReactNode;
};

const bracket = "font-medium text-ink-tertiary";

/**
 * 方括号标题 `[ 名称 ]`：人物、地点、物品的名称——"一个被归档的条目"。
 * 普通的分节标题用 `SectionTitle`。字号用 `className` 改，默认是名称用的 `text-4xl`。
 */
export function BracketTitle({
  level = 3,
  animate = true,
  className,
  children,
  ref,
  ...props
}: BracketTitleProps) {
  const Heading: ElementType = `h${level}`;
  const [inViewRef, inView] = useInView<HTMLHeadingElement>({
    disabled: !animate,
  });
  // 入场：括号先淡入，名称晚 100ms。只淡入、不位移——它们是排在同一行里的字，行内的字做不了位移
  const pending = animate && !inView;
  const playing = animate && inView;
  const bracketEnter = cn(pending && "opacity-0", playing && "animate-fade-in");

  return (
    // 括号和名称排在同一行内而不是弹性盒里：名称换行时，右括号跟在最后一个字后面
    <Heading
      {...props}
      ref={mergeRefs(inViewRef, ref)}
      className={cn("text-4xl font-bold wrap-anywhere text-ink", className)}
    >
      <span
        aria-hidden="true"
        className={cn(bracket, "mr-[0.4em]", bracketEnter)}
      >
        [
      </span>
      <span
        className={
          cn(
            pending && "opacity-0",
            playing && "animate-fade-in [animation-delay:100ms]",
          ) || undefined
        }
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className={cn(bracket, "ml-[0.4em]", bracketEnter)}
      >
        ]
      </span>
    </Heading>
  );
}
