import { useEffect } from "react";

export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    let isMounted = true;
    let cleanup: void | (() => void);

    (async () => {
      if (!isMounted) {
        return;
      }
      cleanup = await effect();
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, deps);
}
