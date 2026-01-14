type ReplyIconProps = {
  style?: React.CSSProperties;
  className?: string;
  size?: number;
};

export function ReplyIcon(props: ReplyIconProps) {
  const { style, className, size = 14 } = props;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      style={style}
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      focusable="false"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5.137 3.118a.518.518 0 0 1 .56-.063c.184.089.3.277.301.483v1.926C14.392 5.822 15 12.336 15 12.427a.534.534 0 0 1-.487.537h-.043a.533.533 0 0 1-.524-.45c-.01-.054-1.412-3.788-7.947-4.05l.002 2a.529.529 0 0 1-.887.397l-3.95-3.548a.54.54 0 0 1 .026-.816l3.948-3.379Z"></path>
    </svg>
  );
}
