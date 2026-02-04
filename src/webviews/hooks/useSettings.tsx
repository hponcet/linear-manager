import { SettingsVscState, VscStateKeys } from "src/vscStates"

import { useVSCState } from "./useVSCState"

const defaultSettings: SettingsVscState = {
  updateCycle: true,
  prefixByLabel: false,
  prefixByLabelList: [],
}

export function useSettings() {
  const [branchesSettings, setSettings, branchesSettingsAreLoading] = useVSCState<SettingsVscState>(
    VscStateKeys.branchesSettings,
    defaultSettings,
  )

  function updateSettings(value: Partial<SettingsVscState>) {
    setSettings((s) => ({ ...s, ...value }))
  }

  return { branchesSettings, updateSettings, branchesSettingsAreLoading }
}
