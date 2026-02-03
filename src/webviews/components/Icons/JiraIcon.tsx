type JiraIconProps = {
  style?: React.CSSProperties;
  className?: string;
  size?: number;
};

export function JiraIcon(props: JiraIconProps) {
  const { style, className, size = 16 } = props;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      style={style}
      viewBox="0 0 16 16"
      role="img"
      focusable="false"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#2684FF"
        d="M14.825 7.631 8.587 1.585l-.6-.582-4.672 4.526L1.18 7.6c-.233.226-.233.582 0 .776l4.304 4.17 2.535 2.458 4.705-4.559.066-.065 2.069-2.004c.2-.194.2-.55-.034-.744Zm-6.839 2.457L5.851 8.02l2.135-2.07 2.135 2.07-2.135 2.07Z"
      ></path>
      <path
        fill="url(#jira-a)"
        d="M7.986 5.917a3.398 3.398 0 0 1 0-4.914l-4.67 4.526L5.85 7.987l2.135-2.07Z"
      ></path>
      <path
        fill="url(#jira-b)"
        d="m10.155 7.986-2.135 2.07a3.436 3.436 0 0 1 0 4.947l4.704-4.56-2.57-2.457Z"
      ></path>
      <defs>
        <linearGradient
          id="jira-a"
          x1="7.619"
          x2="4.721"
          y1="3.832"
          y2="6.822"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".176" stop-color="#0052CC"></stop>
          <stop offset="1" stop-color="#2684FF"></stop>
        </linearGradient>
        <linearGradient
          id="jira-b"
          x1="8.411"
          x2="11.303"
          y1="12.159"
          y2="9.176"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".176" stop-color="#0052CC"></stop>
          <stop offset="1" stop-color="#2684FF"></stop>
        </linearGradient>
      </defs>
    </svg>
  );
}
