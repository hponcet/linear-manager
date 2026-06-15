import { SettingsTab } from "./SettingsView"

export function resolveSettingsTabFromRequest(
  currentTab: SettingsTab,
  tabRequestId: number | undefined,
  requestedTab: SettingsTab | undefined,
): SettingsTab {
  if (tabRequestId && tabRequestId > 0 && requestedTab) {
    return requestedTab
  }

  return currentTab
}
