import { Props } from "src/types/WebviewActionMessage";

// From vscode to React
export interface Message {
  type: string;
}

export interface PropsMessage<K extends keyof Props> extends Message {
  type: "props";
  props: Props[K];
}

// From React to vscode
export interface Action {
  action: string;
}

export interface Console extends Action {
  log: any[];
}

export interface PropsAction {
  action: "get-props";
}

export function isAction(a: any): a is Action {
  return a && (<Action>a).action !== undefined;
}

export function isLog(a: Action): a is Console {
  return (<Console>a).log !== undefined;
}
