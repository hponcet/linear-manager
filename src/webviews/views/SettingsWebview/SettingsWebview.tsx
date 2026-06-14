import { useEffect, useState } from "react"
import { GlobalListenerMessage, Props } from "src/types/ActionMessage"
import { Container } from "src/webviews/components/Container/Container"
import { IssueContextProvider } from "src/webviews/contexts/IssueContext"
import { useProps } from "src/webviews/hooks/useProps"

import { SettingsView } from "./SettingsView"

export function SettingsWebview() {
  const [initialProps, loaded] = useProps<"settings">()
  const [props, setProps] = useState<Props["settings"]>(initialProps)

  useEffect(() => {
    if (loaded) {
      setProps(initialProps)
    }
  }, [loaded, initialProps])

  useEffect(() => {
    function handleMessage(event: MessageEvent<GlobalListenerMessage>) {
      if (event.data.action === "settingsPropsUpdate") {
        setProps(event.data.payload)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const { issueId, linearAccessToken, initialTab } = props

  if (!loaded) {
    return <Container loading={true} />
  }

  const content = <SettingsView initialTab={initialTab} />

  if (issueId && linearAccessToken) {
    return (
      <Container loading={false}>
        <IssueContextProvider issueId={issueId} linearAccessToken={linearAccessToken}>
          {content}
        </IssueContextProvider>
      </Container>
    )
  }

  return <Container loading={false}>{content}</Container>
}
