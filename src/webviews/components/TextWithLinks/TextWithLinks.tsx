import { type MouseEvent } from "react"
import { vscApi } from "src/webviews/hooks/useRequestDataUpdate"
import { parseTextWithLinks } from "src/webviews/utils/parseTextWithLinks"

type TextWithLinksProps = {
  text: string
  className?: string
  onOpenUrl?: (url: string) => void
}

export function TextWithLinks(props: TextWithLinksProps) {
  const { text, className, onOpenUrl } = props
  const segments = parseTextWithLinks(text)

  function openUrl(url: string, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    if (onOpenUrl) {
      onOpenUrl(url)
      return
    }

    void vscApi.postMessage({ type: "openExternalUrl", url })
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <a key={index} href={segment.url} onClick={(event) => openUrl(segment.url, event)}>
            {segment.label}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </span>
  )
}
