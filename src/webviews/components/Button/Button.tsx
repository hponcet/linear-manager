import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
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
      <Tooltip tooltip={tooltip || ""} style={{ position: "relative" }}>
        <button
          ref={ref}
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
);
