type LabelIconProps = {
  style?: React.CSSProperties;
  className?: string;
  size?: number;
};

export function LabelIcon(props: LabelIconProps) {
  const { style, className, size = 14 } = props;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      role="img"
      focusable="false"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path d="M12 11.5V13H5.132v-1.5H12Zm1.5-1.5V6a1.5 1.5 0 0 0-1.346-1.492L12 4.5H5.133a.5.5 0 0 0-.303.103l-.08.076-2.382 2.834a.5.5 0 0 0-.11.234l-.008.087v.331a.5.5 0 0 0 .118.321l2.382 2.835a.5.5 0 0 0 .383.179V13l-.22-.012a2 2 0 0 1-1.16-.54l-.15-.16L1.218 9.45a2 2 0 0 1-.46-1.11L.75 8.165v-.331a2 2 0 0 1 .363-1.147l.106-.14 2.383-2.834a2 2 0 0 1 1.312-.701L5.134 3H12a3 3 0 0 1 3 3v4a3 3 0 0 1-3.002 3v-1.5c.778 0 1.417-.59 1.494-1.347L13.5 10Z"></path>
      <path d="M5.5 8a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"></path>
    </svg>
  );
}
