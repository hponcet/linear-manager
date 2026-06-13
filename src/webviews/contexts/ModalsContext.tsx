import { ReactNode, createContext, useContext, useState } from "react"
import { SerializedAttachment } from "src/types/SerializedLinear"

import { useIssueContext } from "./IssueContext"

import { AttachmentCreationModal } from "../components/Attachments/AttachmentCreationModal"

type ModalsContextProviderProps = {
  isLoading?: boolean
  children: ReactNode
}

type AttachmentCreationModalProps = {
  attachmentId?: SerializedAttachment["id"]
  title?: string
  url?: string
}

export type ModalsContextValueData = {
  isCreatingAttachment: AttachmentCreationModalProps | null
  setIsCreatingAttachment: (data: AttachmentCreationModalProps) => void
}

const ModalsContextValue = createContext<ModalsContextValueData>({
  isCreatingAttachment: null,
  setIsCreatingAttachment: () => undefined,
})

export function ModalsContextProvider(props: ModalsContextProviderProps) {
  const { children } = props

  const { issue, update } = useIssueContext()

  const [isCreatingAttachment, setIsCreatingAttachment] =
    useState<null | AttachmentCreationModalProps>(null)

  return (
    <ModalsContextValue.Provider
      value={{
        isCreatingAttachment,
        setIsCreatingAttachment,
      }}
    >
      {children}
      <AttachmentCreationModal
        issue={issue}
        open={isCreatingAttachment !== null}
        onClose={() => setIsCreatingAttachment(null)}
        onChange={async (data) => {
          if (data.attachmentId) {
            await update.attachments
              .update(data.attachmentId, issue.id, data.url, data.title)
              .catch((err) => {
                console.error("Failed to create attachment:", err)
              })
          } else {
            await update.attachments.create(issue.id, data.url, data.title).catch((err) => {
              console.error("Failed to create attachment:", err)
            })
          }
          setIsCreatingAttachment(null)
        }}
        {...isCreatingAttachment}
      />
    </ModalsContextValue.Provider>
  )
}

export function useModalsContext() {
  return useContext(ModalsContextValue)
}
