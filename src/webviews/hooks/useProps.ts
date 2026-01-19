import { useEffect, useState } from "react";
import { Props, ToWebviewActions } from "src/types/WebviewActionMessage";
import { vscApi } from "./useRequestDataUpdate";

export function useProps<k extends keyof Props>(
  defaults?: Partial<Props[k]>
): [Props[k], boolean] {
  const [loaded, setLoaded] = useState(false);

  const [props, setProps] = useState<Props[k]>(
    (defaults as Props[k]) || ({} as Props[k])
  );

  function handleMessage(e: MessageEvent<ToWebviewActions<k>>) {
    if (e.data.type === "props") {
      setProps(e.data.props);
      setLoaded(true);
    }
  }

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    vscApi.postMessage({ action: "get-props", payload: undefined });
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return [props, loaded];
}
