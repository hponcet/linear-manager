import Picker, { Theme } from "emoji-picker-react"
import { useMemo } from "react"
import { Popover, Whisper, type WhisperProps } from "rsuite"
import { SerializedReaction } from "src/types/SerializedLinear"
import { useVsCodeTheme } from "src/webviews/hooks/useVsCodeTheme"

import { Emoji } from "./Emoji"

import { Button } from "../Button/Button"
import { EmojiIcon } from "../Icons/EmojiIcon"

import "./EmojiPicker.scss"

type EmojiPickerProps = {
  onSelect?: (emoji: string) => void
  onUnselect?: (id: string) => void
  size?: number
  reactions?: SerializedReaction[]
  placement?: WhisperProps["placement"]
}

export function EmojiPicker(props: EmojiPickerProps) {
  const { onSelect, onUnselect, size, reactions, placement = "bottomEnd" } = props
  const vsCodeTheme = useVsCodeTheme()
  const emojiTheme = vsCodeTheme === "light" ? Theme.LIGHT : Theme.DARK
  const groupedReactions = useMemo(
    () =>
      reactions?.reduce(
        (acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = []
          }
          acc[reaction.emoji].push(reaction)
          return acc
        },
        {} as Record<string, SerializedReaction[]>,
      ),
    [reactions],
  )

  const renderSpeaker = ({ onClose, ...rest }: any, ref: any) => {
    return (
      <Popover
        ref={ref}
        full
        arrow={false}
        style={{
          padding: 0,
          border: "none",
          backgroundColor: "transparent",
        }}
        onClose={onClose}
        {...rest}
      >
        <Picker
          onEmojiClick={(emoji) => {
            onSelect?.(emoji.unified)
            onClose()
          }}
          width={230}
          height={270}
          theme={emojiTheme}
          previewConfig={{ showPreview: false }}
          skinTonesDisabled
          autoFocusSearch={false}
          open
        />
      </Popover>
    )
  }

  return (
    <div className="emojiPickerContainer">
      {groupedReactions ? (
        <div className="emojiPickerReactions">
          {Object.entries(groupedReactions).map(([emoji, r]) => (
            <Emoji
              key={emoji}
              emoji={emoji}
              reactions={r}
              add={() => onSelect?.(emoji)}
              remove={onUnselect}
            />
          ))}
        </div>
      ) : null}
      <Whisper
        trigger="click"
        controlId="control-id-click"
        placement={placement}
        speaker={renderSpeaker}
        preventOverflow
      >
        <span>
          <Button appearance="subtle">
            <EmojiIcon size={size} />
          </Button>
        </span>
      </Whisper>
    </div>
  )
}
