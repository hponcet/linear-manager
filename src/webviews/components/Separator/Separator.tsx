type SeparatorProps = {
  style?: React.CSSProperties;
  className?: string;
};

export function Separator(props: SeparatorProps) {
  const { style, className } = props;

  return (
    <hr
      style={{
        width: "100%",
        margin: "16px 0 18px 0",
        ...style,
      }}
      className={className || ""}
    />
  );
}
