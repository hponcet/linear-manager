import { ReactNode } from "react";
import { Animation, Loader, Toggle } from "rsuite";
import { ResolveIcon } from "../Icons/ResolveIcon";
import { CrossIcon } from "../Icons/CrossIcon";

export type FormQueueFieldProps = {
  indexKey: string;
  label: ReactNode;
  input?: ReactNode | ((isExpand?: boolean) => ReactNode);
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  validated?: boolean;
  showToggle?: boolean;
  processing?: boolean;
  executed?: boolean;
  allDone?: boolean;
  onEnable?: () => void;
  onDisable?: () => void;
  onProcess?: () => Promise<void>;
  errors?: any[];
};

export function FormQueueField(props: FormQueueFieldProps) {
  const {
    label,
    input,
    disabled,
    loading,
    onEnable,
    onDisable,
    required,
    validated,
    executed,
    showToggle = true,
    errors = [],
    processing,
    allDone,
  } = props;

  const expand = !disabled && !validated && !loading && !processing && !allDone;

  const showAllInputs = !processing && !executed;

  return (
    <Animation.Collapse in={showAllInputs || !disabled}>
      <div
        style={{
          marginBottom: 30,
          pointerEvents: loading ? "none" : "auto",
          opacity:
            processing && !loading && !validated && !errors.length ? 0.4 : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              width: "-webkit-fill-available",
              color: "var(--rs-text-secondary)",
              ...(processing || executed ? {} : { fontSize: 15 }),
            }}
          >
            {loading ? (
              <Loader size="xs" style={{ marginRight: 8 }} />
            ) : validated ? (
              <ResolveIcon
                size={14}
                style={{ marginRight: 8, fill: "var(--color-success)" }}
              />
            ) : !required && errors.length > 0 ? (
              <CrossIcon
                size={14}
                style={{
                  fill: "var(--color-error)",
                  stroke: "var(--color-error)",
                  marginRight: 8,
                }}
              />
            ) : null}
            {label}
            {!disabled && !expand && input
              ? typeof input === "function"
                ? input(true)
                : input
              : null}
          </label>
          <div style={{ marginLeft: "auto" }}>
            {validated ? null : !required ? (
              <>
                {showToggle && (!processing || disabled) ? (
                  <Toggle
                    size="xs"
                    checked={!disabled}
                    disabled={loading || validated}
                    onChange={(checked) => {
                      if (checked) onEnable?.();
                      else onDisable?.();
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        {input ? (
          <Animation.Collapse in={expand}>
            <div
              style={{
                pointerEvents:
                  disabled || loading || validated ? "none" : "auto",
              }}
            >
              {typeof input === "function" ? input() : input}
              {errors.length > 0 ? (
                <div
                  style={{
                    marginTop: 8,
                    marginLeft: 8,
                    color: "var(--color-error)",
                    fontSize: 12,
                  }}
                >
                  {errors.map((error, index) => (
                    <div key={index}>{error?.message || String(error)}</div>
                  ))}
                </div>
              ) : null}
            </div>
          </Animation.Collapse>
        ) : null}
      </div>
    </Animation.Collapse>
  );
}
