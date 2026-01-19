import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

import { Tooltip } from "../Tooltip/Tooltip";

import "./Button.scss";
import { Loader } from "rsuite";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: `${"#" | "var"}${string}`;
  rounded?: boolean;
  loading?: boolean;
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
      loading,
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
          disabled={disabled || loading}
          btn-rounded={String(!!rounded)}
          {...buttonProps}
        >
          {loading ? <Loader size="xs" style={{ marginRight: 8 }} /> : null}
          {children}
        </button>
      </Tooltip>
    );
  }
);
