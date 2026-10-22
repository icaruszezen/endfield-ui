import { createContext, type Context } from "react";

export function createLazyContext<T>(defaultValue: T) {
  let context: Context<T> | undefined;
  return () => (context ??= createContext(defaultValue));
}
