import { useState } from "react";
import { useAsyncEffect } from "./useAsyncEffect";

export function useAsyncMemo<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList,
  initialValue?: T
): [T | null, boolean] {
  const [value, setValue] = useState<T | null>(initialValue || null);
  const [isLoading, setLoading] = useState<boolean>(!initialValue);

  useAsyncEffect(async () => {
    let isMounted = true;

    setLoading(true);
    try {
      const result = await asyncFunction();
      if (isMounted) {
        setValue(result);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return [value, isLoading];
}
