import { useCallback, useState } from "react";

type Options<T> = {
  /** 传入即为受控 */
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
};

/** 合并受控与非受控两种用法；值没有变化时不触发 `onChange`。 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: Options<T>): [T, (next: T) => void] {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;

  const set = useCallback(
    (next: T) => {
      if (Object.is(next, current)) return;
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, current, onChange],
  );

  return [current, set];
}
