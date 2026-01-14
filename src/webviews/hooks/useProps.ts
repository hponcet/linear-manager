import { useEffect, useState } from "react";
import { useAPI } from "./useVSCodeAPI";
import { Props } from "src/types/WebviewActionMessage";
import { IssueMessage } from "src/ipc/issueMessaging";

export function useProps<k extends keyof Props>(
  defaults?: Partial<Props[k]>
): [Props[k], boolean] {
  const [loaded, setLoaded] = useState(false);

  const [props, setProps] = useState<Props[k]>(
    (defaults as Props[k]) || ({} as Props[k])
  );

  const { vscApi } = useAPI();

  function handleMessage(e: MessageEvent<IssueMessage>) {
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
  }, [vscApi]);

  return [props, loaded];
}
