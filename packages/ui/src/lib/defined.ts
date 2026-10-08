/**
 * 去掉值是 `undefined` 的属性。把控件的属性合并到使用方给的元素上之前用：
 * 控件没有的东西（比如 `href`），不能把那个元素自己写的盖掉。
 */
export function defined<T extends object>(props: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
