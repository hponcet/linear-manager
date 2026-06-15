let activeSessionId = 0
let extensionActive = false

export function activateExtensionSession(): number {
  activeSessionId += 1
  extensionActive = true
  return activeSessionId
}

export function deactivateExtensionSession(): void {
  extensionActive = false
  activeSessionId += 1
}

export function isExtensionSession(sessionId: number): boolean {
  return extensionActive && sessionId === activeSessionId
}

export function isExtensionActive(): boolean {
  return extensionActive
}
