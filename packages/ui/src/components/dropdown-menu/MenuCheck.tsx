import { Check } from "../../icons/Check";
import { cn } from "../../lib/cn";

export type MenuCheckProps = {
  checked: boolean;
  disabled?: boolean;
};

/**
 * 菜单复选项、多选选项行首的小方格。画法同复选框（`checkbox/choice-style.ts`），
 * 缩到 16px：未选是凹陷底 + 描边，已选是反转块 + 对勾；祖先上有
 * `data-choice="diamond"` 时换成菱形，已选是实心的、不画对勾。
 *
 * 纯展示：勾没勾由所在的选项用 `aria-checked` / `aria-selected` 告诉读屏。
 */
export function MenuCheck({ checked, disabled = false }: MenuCheckProps) {
  return (
    // 外面这一层是定位盒：菱形比它小一圈，转 45° 后对角线正好还是 16px
    <span
      aria-hidden="true"
      data-checked={checked ? "" : undefined}
      className="flex size-4 shrink-0 items-center justify-center"
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center border-2 transition-colors duration-(--duration-fast) ease-standard choice-diamond:size-3 choice-diamond:rotate-45",
          disabled
            ? [
                "border-ink-disabled bg-surface-sunken text-ink-disabled",
                // 菱形方案里"已选"只靠实心表达，禁用了也要保持实心
                checked && "choice-diamond:bg-ink-disabled",
              ]
            : checked
              ? "border-surface-inverse bg-surface-inverse text-accent-ink-inverse"
              : "border-line-strong bg-surface-sunken",
        )}
      >
        {checked && (
          <Check size={10} strokeWidth={4} className="choice-diamond:hidden" />
        )}
      </span>
    </span>
  );
}
