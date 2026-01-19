import { cloneElement, ReactElement, useEffect, useState } from "react";
import { FormQueueFieldProps } from "./FormQueueField";
import { Button } from "../Button/Button";

export type FormQueueAsyncProps = {
  children: ReactElement<FormQueueFieldProps>[];
  startButtonLabel?: string;
  endButtonLabel?: string;
  continueOnError?: boolean;
  canRestart?: boolean;
  canRetry?: boolean;
  actionOnComplete?: () => void;
};

type QueueItem = {
  fn?: () => Promise<void>;
  loading: boolean;
  errors: any[];
  disabled?: boolean;
  validated?: boolean;
  validations?: (value: any) => string | null;
};

export function FormQueueAsync(props: FormQueueAsyncProps) {
  const {
    children,
    startButtonLabel,
    endButtonLabel,
    continueOnError,
    canRestart,
    canRetry,
    actionOnComplete,
  } = props;

  const [processing, setProcessing] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>(
    children.map(
      (child): QueueItem => ({
        fn: child.props.onProcess,
        loading: false,
        disabled: child.props.disabled ?? undefined,
        errors: [],
        validated: false,
      })
    )
  );

  useEffect(() => {
    if (processing || executed) return;

    setQueue((queue) =>
      children.map((child, i): QueueItem => {
        return {
          ...queue[i],
          disabled: queue[i].disabled ?? child.props.disabled,
          errors: child.props.errors || [],
          fn: child.props.onProcess,
        };
      })
    );
  }, [children, processing, executed]);

  const processDone = queue.every((item) => item.disabled || item.validated);
  const processLoading = queue.some((item) => item.loading) || processing;
  const processHasErrors = queue.some((item) => item.errors.length > 0);
  const processCanRetry = canRetry && executed && processHasErrors;
  const processCanRestart = canRestart && executed;

  async function executeQueue(executeType?: "restart" | "retry") {
    if (executed) {
      if (actionOnComplete && processDone) {
        actionOnComplete();
      }

      if (processCanRestart && executeType === "restart") {
        const newQueue = queue.map((item, index) => ({
          ...item,
          loading: false,
          errors: [],
          validated: false,
          showToggle: !item.validated,
        }));
        setQueue(newQueue);
        setExecuted(false);
        return;
      }
      if (processCanRetry && executeType === "retry") {
        const newQueue = queue.map((item) => {
          if (item.errors.length > 0 && !item.disabled) {
            return {
              ...item,
              loading: false,
              errors: [],
              validated: false,
              showToggle: true,
            };
          }
          return item;
        });
        setQueue(newQueue);
        setExecuted(false);
      }
    }

    setProcessing(true);
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].disabled || queue[i].loading || queue[i].validated) {
        continue;
      }
      const newQueue = [...queue];
      newQueue[i].loading = true;
      newQueue[i].errors = [];
      setQueue(newQueue);

      try {
        await newQueue[i].fn?.();
        newQueue[i].validated = true;
      } catch (e) {
        if (!continueOnError) {
          newQueue[i].errors = [e];
          setQueue(newQueue);
          break;
        }
        newQueue[i].errors.push(e);
      } finally {
        newQueue[i].loading = false;
        setQueue(newQueue);
      }
    }
    setProcessing(false);
    setExecuted(true);
  }

  return (
    <div className="formQueueAsyncContainer">
      {children.map((child, index) =>
        cloneElement(child, {
          ...child.props,
          key: index,
          disabled: queue[index]?.disabled,
          loading: queue[index]?.loading,
          validated: queue[index]?.validated,
          errors: queue[index]?.errors,
          processing,
          executed,
          allDone: processDone,
          onDisable: !child.props.required
            ? () => {
                const newQueue = [...queue];
                newQueue[index].disabled = true;
                setQueue(newQueue);
              }
            : undefined,
          onEnable: !child.props.required
            ? () => {
                const newQueue = [...queue];
                newQueue[index].disabled = false;
                setQueue(newQueue);
              }
            : undefined,
        })
      )}
      <div style={{ marginLeft: "auto", display: "table" }}>
        {canRestart && !processing && executed ? (
          <Button
            onClick={() => executeQueue("restart")}
            color="#353333"
            style={{ marginTop: 20, marginRight: 8, padding: "0 16px" }}
          >
            Restart
          </Button>
        ) : null}
        <Button
          disabled={processLoading || (executed && !canRetry)}
          tooltip={
            executed && !canRestart && !canRetry
              ? "All actions have been processed"
              : queue.every((item) => item.validated)
              ? "All actions are already validated"
              : undefined
          }
          loading={processing}
          onClick={() => executeQueue(executed ? "retry" : undefined)}
          style={{
            marginTop: 20,
            padding: "0 16px",
            backgroundColor: processDone
              ? "#023b0a"
              : processCanRetry || processHasErrors
              ? "#a21a24"
              : "#353333",
          }}
        >
          {processDone
            ? endButtonLabel || "Done"
            : processing
            ? "Processing..."
            : processCanRetry
            ? "Retry failed steps"
            : processHasErrors
            ? "Failed"
            : startButtonLabel || "Execute"}
        </Button>
      </div>
    </div>
  );
}
