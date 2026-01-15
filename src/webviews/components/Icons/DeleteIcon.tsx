type ReplyIconProps = {
  style?: React.CSSProperties;
  className?: string;
  size?: number;
};

export function DeleteIcon(props: ReplyIconProps) {
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
      <path
        fillRule="evenodd"
        d="m2 3 1.652 9.911A2.5 2.5 0 0 0 6.118 15h3.764a2.5 2.5 0 0 0 2.466-2.089L14 3H2Zm1.77 1.5 1.361 8.164a1 1 0 0 0 .987.836h3.764a1 1 0 0 0 .987-.836l1.36-8.164H3.771Z"
        clipRule="evenodd"
      ></path>
      <path d="M5.5 2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5v1h-5v-1Z"></path>
      <path d="M1 3.75A.75.75 0 0 1 1.75 3h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 3.75Z"></path>
    </svg>
  );
}
