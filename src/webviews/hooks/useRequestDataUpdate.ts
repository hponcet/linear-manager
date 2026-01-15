import { useEffect } from "react";
import { Action, ToWebviewActions } from "src/types/WebviewActionMessage";

export type RequestDataUpdateActions =
  | Action<"updateIssue", number | undefined>
  | Action<"updateComments", number | undefined>;

type RequestDataUpdateParams = {
  [K in RequestDataUpdateActions["type"]]: (
    p: Extract<RequestDataUpdateActions, { type: K }>["payload"]
  ) => void;
};

export function useRequestDataUpdate(params: RequestDataUpdateParams): void {
  const { updateIssue, updateComments } = params;

  function handleRequestDataUpdate(e: MessageEvent<ToWebviewActions<any>>) {
    const msg = e.data;
    if (msg.type === "updateIssue") updateIssue?.(msg.payload);
    if (msg.type === "updateComments") updateComments?.(msg.payload);
  }

  useEffect(() => {
    window.addEventListener("message", handleRequestDataUpdate);
    return () => {
      window.removeEventListener("message", handleRequestDataUpdate);
    };
  }, []);
}
