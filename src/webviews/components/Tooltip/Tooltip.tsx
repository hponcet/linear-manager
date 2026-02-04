import { ReactNode } from "react"
import { Whisper, Tooltip as RSTooltip, type WhisperProps as RSWhisperProps } from "rsuite"

type TooltipProps = Omit<RSWhisperProps, "speaker"> & {
  tooltip?: ReactNode
}

export function Tooltip(props: TooltipProps) {
  const { children, tooltip, preventOverflow, ...tooltipProps } = props

  return (
    <Whisper
      controlId="control-id-hover"
      trigger="hover"
      speaker={<RSTooltip arrow={false}>{tooltip}</RSTooltip>}
      disabled={!tooltip}
      delayOpen={1000}
      preventOverflow={preventOverflow ?? true}
      placement="auto"
      {...tooltipProps}
    >
      {children}
    </Whisper>
  )
}
