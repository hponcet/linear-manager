import { ReactNode } from "react";
import {
  Whisper,
  Tooltip as RSTooltip,
  type WhisperProps as RSWhisperProps,
} from "rsuite";

type TooltipProps = Omit<RSWhisperProps, "speaker"> & {
  tooltip?: ReactNode;
};

export function Tooltip(props: TooltipProps) {
  const { children, tooltip, ...tooltipProps } = props;

  return (
    <Whisper
      placement="top"
      controlId="control-id-hover"
      trigger="hover"
      speaker={<RSTooltip arrow={false}>{tooltip}</RSTooltip>}
      disabled={!tooltip}
      delayOpen={1000}
      {...tooltipProps}
    >
      {children}
    </Whisper>
  );
}
