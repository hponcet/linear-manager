export function addKeyOnItem<I extends object, K extends "history" | "comment">(
  item: I,
  key: K
): I & { __key: K } {
  return { ...item, __key: key };
}
