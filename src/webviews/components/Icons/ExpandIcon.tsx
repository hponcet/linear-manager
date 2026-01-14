type ReplyIconProps = {
  style?: React.CSSProperties;
  className?: string;
  size?: number;
};

export function ExpandIcon(props: ReplyIconProps) {
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
        d="M8.35355 4.56051C8.15829 4.36525 7.84171 4.36525 7.64645 4.56051L5.35355 6.8534C5.15829 7.04866 4.84171 7.04866 4.64645 6.8534C4.45118 6.65814 4.45118 6.34156 4.64645 6.1463L6.93934 3.8534C7.52513 3.26762 8.47487 3.26762 9.06066 3.8534L11.3536 6.1463C11.5488 6.34156 11.5488 6.65814 11.3536 6.8534C11.1583 7.04866 10.8417 7.04866 10.6464 6.8534L8.35355 4.56051Z"
      ></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.64645 11.4392C7.84171 11.6344 8.15829 11.6344 8.35355 11.4392L10.6464 9.14629C10.8417 8.95103 11.1583 8.95103 11.3536 9.14629C11.5488 9.34156 11.5488 9.65814 11.3536 9.8534L9.06066 12.1463C8.47487 12.7321 7.52513 12.7321 6.93934 12.1463L4.64645 9.8534C4.45118 9.65814 4.45118 9.34156 4.64645 9.14629C4.84171 8.95103 5.15829 8.95103 5.35355 9.14629L7.64645 11.4392Z"
      ></path>
    </svg>
  );
}
