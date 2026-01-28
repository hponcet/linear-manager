export function addKeyOnItem<I extends object, K extends "history" | "comment">(
  item: I,
  key: K,
): I & { __key: K } {
  (item as I & { __key: K }).__key = key;
  return item as I & { __key: K };
}
