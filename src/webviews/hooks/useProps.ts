import { useEffect, useState } from "react";
import { vscApi } from "../utils/vscMessaging";
import { Props, ToWebviewActions } from "src/types/WebviewActionMessage";

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
    vscApi.postMessage({ action: "get-props" });
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return [props, loaded];
}
