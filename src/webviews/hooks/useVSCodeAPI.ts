import { VsCodeApi } from "src/types/WebviewActionMessage";

// @ts-expect-error
const acquireVsCodeApi = (window.acquireVsCodeApi ||
  (() => ({
    postMessage: () => {},
    setState: () => {},
    getState: () => ({}),
  }))) as () => VsCodeApi;

const vscApi = acquireVsCodeApi();

function useAPI() {
  return { vscApi };
}

export { vscApi, useAPI };
