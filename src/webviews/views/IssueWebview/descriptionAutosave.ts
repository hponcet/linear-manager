import { inspectLinearMarkdown } from "src/webviews/components/Editor/linearMarkdown"

export type DescriptionAutosave = ReturnType<typeof createDescriptionAutosave>

export function restoreDescriptionDraft(savedDescription: string, draft?: string) {
  if (draft === undefined || inspectLinearMarkdown(draft).ok) {
    return { description: draft ?? savedDescription, rejectedDraft: undefined }
  }

  return { description: savedDescription, rejectedDraft: draft }
}

export function createDescriptionAutosave(save: (value: string) => Promise<boolean>, delay = 750) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: string | undefined
  let running: Promise<void> | undefined
  let disposed = false

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  const drain = async () => {
    while (!disposed && pending !== undefined) {
      const value = pending
      pending = undefined

      let saved = false
      try {
        saved = await save(value)
      } catch {
        saved = false
      }

      if (!saved && pending === undefined) {
        pending = value
        return
      }
    }
  }

  const flush = (): Promise<void> => {
    clearTimer()
    if (disposed) {
      return Promise.resolve()
    }

    if (!running) {
      running = drain().finally(() => {
        running = undefined
      })
    }

    return running
  }

  return {
    schedule(value: string) {
      if (disposed) return

      pending = value
      clearTimer()
      timer = setTimeout(() => {
        timer = undefined
        void flush()
      }, delay)
    },
    flush,
    cancelScheduled() {
      clearTimer()
      pending = undefined
    },
    dispose() {
      disposed = true
      clearTimer()
    },
  }
}
