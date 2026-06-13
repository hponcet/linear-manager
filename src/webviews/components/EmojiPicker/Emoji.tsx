import { SerializedReaction } from "src/types/SerializedLinear"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { emojis } from "../emojis"

import "./Emoji.scss"

type EmojiProps = {
  emoji: string
  reactions: SerializedReaction[]
  add?: (emoji: string) => void
  remove?: (id: string) => void
}

export function Emoji(props: EmojiProps) {
  const { emoji, reactions, remove, add } = props
  const { me } = useIssueContext()

  const myReaction = reactions.find((r) => r.userId === me?.id)

  const action = myReaction ? () => remove?.(myReaction?.id || "") : () => add?.(emoji)

  return (
    <div className="emoji" onClick={action}>
      <span className="emojiSymbol">{emojis[emoji]}</span>
      <span className="emojiCount">{reactions.length}</span>
    </div>
  )
}
