type ReplyIconProps = {
  style?: React.CSSProperties;
  className?: string;
  size?: number;
};

export function CollapseIcon(props: ReplyIconProps) {
  const { style, className, size = 16 } = props;

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
        clipRule="evenodd"
        d="M7.64641 5.43934C7.84167 5.6346 8.15826 5.6346 8.35352 5.43934L10.6464 3.14645C10.8417 2.95119 11.1583 2.95119 11.3535 3.14645C11.5488 3.34171 11.5488 3.65829 11.3535 3.85355L9.06062 6.14645C8.47484 6.73223 7.52509 6.73223 6.9393 6.14645L4.64641 3.85355C4.45115 3.65829 4.45115 3.34171 4.64641 3.14645C4.84167 2.95118 5.15826 2.95118 5.35352 3.14645L7.64641 5.43934Z"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.35343 10.5607C8.15817 10.3654 7.84159 10.3654 7.64632 10.5607L5.35343 12.8536C5.15817 13.0488 4.84159 13.0488 4.64632 12.8536C4.45106 12.6583 4.45106 12.3417 4.64632 12.1464L6.93922 9.85355C7.525 9.26777 8.47475 9.26777 9.06054 9.85355L11.3534 12.1464C11.5487 12.3417 11.5487 12.6583 11.3534 12.8536C11.1582 13.0488 10.8416 13.0488 10.6463 12.8536L8.35343 10.5607Z"
      ></path>
    </svg>
  );
}
