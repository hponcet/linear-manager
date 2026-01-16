import { ButtonHTMLAttributes, ReactNode } from "react";

import { Tooltip } from "../Tooltip/Tooltip";

import "./Button.scss";

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
    <Tooltip tooltip={tooltip || ""}>
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
    </Tooltip>
  );
}
