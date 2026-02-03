import {
  cloneElement,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FormQueueFieldProps } from "./FormQueueField";
import { Button } from "../Button/Button";

export type FormQueueAsyncProps = {
  children: (ReactElement<FormQueueFieldProps> | null)[];
  startButtonLabel?: string;
  endButtonLabel?: string;
  continueOnError?: boolean;
  noActions?: boolean;
  canRestart?: boolean;
  canRetry?: boolean;
  actions?: ReactNode[];
  onComplete?: () => void;
  onReset?: () => void;
};

type QueueItem = {
  fn?: () => Promise<void>;
  loading: boolean;
  errors: any[];
  disabled?: boolean;
  validated?: boolean;
  validations?: (value: any) => string | null;
  showToggle?: boolean;
};

export function FormQueueAsync(props: FormQueueAsyncProps) {
  const {
    children,
    startButtonLabel,
    endButtonLabel,
    continueOnError,
    canRestart,
    canRetry,
    noActions,
    onComplete,
    onReset,
    actions,
  } = props;

  const nonNullChildren = useMemo(
    () => children.filter(Boolean) as ReactElement<FormQueueFieldProps>[],
    [children],
  );

  const [processing, setProcessing] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [queue, setQueue] = useState<Record<string, QueueItem>>(
    nonNullChildren.reduce(
      (acc, child) => ({
        ...acc,
        [child.props.indexKey]: {
          fn: child.props.onProcess,
          loading: false,
          disabled: child.props.disabled ?? undefined,
          errors: [],
          validated: false,
        },
      }),
      {} as Record<string, QueueItem>,
    ),
  );

  useEffect(() => {
    if (processing || executed) return;

    setQueue((queue) =>
      nonNullChildren.reduce(
        (acc, { props }) => ({
          ...acc,
          [props.indexKey]: {
            ...queue[props.indexKey],
            disabled: queue[props.indexKey]?.disabled ?? props.disabled,
            errors: props.errors || [],
            fn: props.onProcess,
          },
        }),
        {} as Record<string, QueueItem>,
      ),
    );
  }, [nonNullChildren, processing, executed]);

  const processDone = Object.values(queue).every(
    (item) => item.disabled || item.validated,
  );
  const processLoading =
    Object.values(queue).some((item) => item.loading) || processing;
  const processHasErrors = Object.values(queue).some(
    (item) => !item.disabled && item.errors.length > 0,
  );
  const processCanRetry = canRetry && executed && processHasErrors;
  const processCanRestart = canRestart && executed;

  async function executeQueue(executeType?: "restart" | "retry") {
    if (executed) {
      if (onComplete && processDone && !executeType) {
        onComplete();
      }

      if (processCanRestart && executeType === "restart") {
        setQueue((queue) => {
          return Object.fromEntries(
            Object.entries(queue).map(([key, item]) => [
              key,
              {
                ...item,
                loading: false,
                errors: [],
                validated: false,
                showToggle: !item.validated,
              },
            ]),
          );
        });
        setExecuted(false);
        return;
      }
      if (processCanRetry && executeType === "retry") {
        setQueue((queue) => {
          return Object.fromEntries(
            Object.entries(queue).map(([key, item]) => [
              key,
              item.errors.length > 0 && !item.disabled
                ? {
                    ...item,
                    loading: false,
                    errors: [],
                    validated: false,
                    showToggle: true,
                  }
                : item,
            ]),
          );
        });
        setExecuted(false);
      }
    }

    setProcessing(true);

    for (const indexKey of Object.keys(queue)) {
      if (
        queue[indexKey]?.disabled ||
        queue[indexKey]?.loading ||
        queue[indexKey]?.validated
      ) {
        continue;
      }

      const newQueue = { ...queue };
      newQueue[indexKey].loading = true;
      newQueue[indexKey].errors = [];
      setQueue(newQueue);

      try {
        await newQueue[indexKey].fn?.();
        newQueue[indexKey].validated = true;
      } catch (e) {
        if (!continueOnError) {
          newQueue[indexKey].errors = [e];
          setQueue(newQueue);
          break;
        }
        newQueue[indexKey].errors.push(e);
      } finally {
        newQueue[indexKey].loading = false;
        setQueue(newQueue);
      }
    }
    setProcessing(false);
    setExecuted(true);
  }

  return (
    <div className="formQueueAsyncContainer">
      {nonNullChildren.map((child) =>
        cloneElement(child, {
          ...child.props,
          disabled: queue[child.props.indexKey]?.disabled,
          loading: queue[child.props.indexKey]?.loading,
          validated: queue[child.props.indexKey]?.validated,
          errors: queue[child.props.indexKey]?.errors,
          processing: processLoading,
          executed,
          allDone: processDone,
          onDisable: !child.props.required
            ? () => {
                setQueue((queue) => {
                  const newQueue = { ...queue };
                  newQueue[child.props.indexKey].disabled = true;
                  return newQueue;
                });
              }
            : undefined,
          onEnable: !child.props.required
            ? () => {
                setQueue((queue) => {
                  const newQueue = { ...queue };
                  newQueue[child.props.indexKey].disabled = false;
                  return newQueue;
                });
              }
            : undefined,
        }),
      )}
      {!noActions ? (
        <div style={{ marginLeft: "auto", display: "table", marginTop: 20 }}>
          {!executed && !processing && actions}
          {canRestart && !processing && executed ? (
            <Button
              onClick={() => {
                onReset?.();
                executeQueue("restart");
              }}
              style={{
                marginRight: 8,
                padding: "0 16px",
              }}
            >
              Reset
            </Button>
          ) : null}
          <Button
            disabled={
              processLoading || (executed && !canRetry) || processHasErrors
            }
            tooltip={
              executed && !canRestart && !canRetry
                ? "All actions have been processed"
                : Object.values(queue).every((item) => item.validated)
                  ? "All actions are already validated"
                  : undefined
            }
            loading={processing}
            onClick={() => {
              if (processDone && onComplete) {
                onComplete();
              } else if (executed) {
                if (processCanRetry) {
                  executeQueue("retry");
                }
              } else {
                executeQueue();
              }
            }}
            style={{ padding: "0 16px" }}
            color={processCanRetry ? "#a21a24" : "#353333"}
          >
            {processDone
              ? endButtonLabel || "Done"
              : processing
                ? "Processing..."
                : processCanRetry
                  ? "Retry failed steps"
                  : startButtonLabel || "Execute"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
