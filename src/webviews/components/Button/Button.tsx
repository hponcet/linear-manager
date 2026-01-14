import { ButtonHTMLAttributes, ReactNode } from "react";

import "./Button.scss";
import { Whisper, Tooltip } from "rsuite";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: `#${string}`;
  rounded?: boolean;
};

export function Button(props: ButtonProps) {
  const {
    children,
    tooltip,
    onClick,
    disabled,
    className,
    color,
    style,
    rounded,
    ...buttonProps
  } = props;

  return (
    <Whisper
      placement="top"
      controlId="control-id-hover"
      trigger="hover"
      speaker={<Tooltip arrow={false}>{tooltip}</Tooltip>}
      disabled={!tooltip}
      delayOpen={1000}
    >
      <button
        className={`button ${className || ""}`}
        style={{
          backgroundColor: disabled ? `${color}33` : color,
          borderColor: color ? `${color}00` : undefined,
          ...style,
        }}
        onClick={onClick}
        disabled={disabled}
        btn-rounded={String(!!rounded)}
        {...buttonProps}
      >
        {children}
      </button>
    </Whisper>
  );
}
