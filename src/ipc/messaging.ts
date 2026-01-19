import { FromWebviewActions } from "src/types/WebviewActionMessage";

// From vscode to React
export interface Message {
  type: string;
}

// From React to vscode
export interface Action {
  action: string;
  payload?: any;
}

export interface Console extends Action {
  log: any[];
}

export interface PropsAction {
  action: "get-props";
  payload: undefined;
}

export function isAction(a: any): a is FromWebviewActions {
  return a && (<Action>a).action !== undefined;
}

export function isLog(a: Action): a is Console {
  return (<Console>a).log !== undefined;
}
