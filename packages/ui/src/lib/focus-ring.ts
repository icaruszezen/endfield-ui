/** 2px `focus` 色的环，与元素间隔 2px；仅键盘聚焦时出现。 */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** 画在元素内侧的焦点环，用在会被滚动容器裁切的地方。 */
export const focusRingInset =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/** 外框自己不能聚焦、里面的控件能：控件聚焦时把环画在外框上（输入框）。 */
export const focusRingWithin =
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus";
