type StackIconProps = {
  style?: React.CSSProperties
  className?: string
  size?: number
}

export function StackIcon(props: StackIconProps) {
  const { style, className, size = 16 } = props

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
      <path d="M3.22598 11.4783C2.60746 12.4742 1.78878 13.3328 0.826172 13.9979C0.88385 13.9993 0.941698 14 0.999713 14C4.86571 14 7.99971 10.866 7.99971 7C7.99971 3.13401 4.86571 0 0.999713 0C0.941783 0 0.884016 0.000703812 0.826422 0.00210309C1.78901 0.66726 2.60765 1.5259 3.22615 2.52183C4.87022 3.3408 5.99971 5.0385 5.99971 7C5.99971 8.96157 4.87014 10.6593 3.22598 11.4783Z"></path>
    </svg>
  )
}
