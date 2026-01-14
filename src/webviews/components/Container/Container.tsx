import { Suspense } from "react";

import "./Container.css";

type ContainerProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
};

export function Container(props: ContainerProps) {
  const { children, className, style, loading } = props;

  if (loading) {
    return (
      <div className={`container ${className || ""}`} style={style}>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <div className={`container ${className || ""}`} style={style}>
        <div className="content">{children}</div>
      </div>
    </Suspense>
  );
}
