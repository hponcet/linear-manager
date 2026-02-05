import { Issue } from "@linear/sdk"
import { Modal } from "rsuite"
import { FormQueueField } from "src/webviews/components/FormQueueAsync/FormQueueField"
import { InfoIcon } from "src/webviews/components/Icons/InfoIcon"
import { PrefixByLabelPicker } from "src/webviews/components/PrefixByLabelPicker/PrefixByLabelPicker"
import { Tooltip } from "src/webviews/components/Tooltip/Tooltip"
import { useSettings } from "src/webviews/hooks/useSettings"

type BranchNamingSettingsProps = {
  issue: Issue
  open: boolean
  onClose?: () => void
}

export function BranchNamingSettings(props: BranchNamingSettingsProps) {
  const { issue, open, onClose } = props

  const { updateSettings, branchesSettings } = useSettings()

  return (
    <Modal size="sm" backdrop="static" open={open} onClose={onClose}>
      <Modal.Header>
        <Modal.Title>Branch Naming Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FormQueueField
          key="prefix-by-label"
          indexKey="prefix-by-label"
          label={
            <div style={{ display: "flex", alignItems: "center" }}>
              <div>Use branch prefix from labels</div>
              <Tooltip
                tooltip={
                  "Automatically add a prefix to the branch name based on the issue's labels.\n\nYou can configure label-prefix pairs in the settings below.\n\nIn case of multiple matching labels or no matching labels, the prefix from the label with the highest priority (top of the list) will be used."
                }
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <InfoIcon style={{ marginLeft: 4 }} />
                </div>
              </Tooltip>
            </div>
          }
          input={
            <PrefixByLabelPicker
              value={branchesSettings?.prefixByLabelList || []}
              issue={issue}
              onChange={(value) =>
                updateSettings({
                  prefixByLabelList: value?.map(({ label, prefix }) => ({
                    label: {
                      id: label?.id || "",
                      name: label?.name || "",
                      color: label?.color || "",
                    },
                    prefix,
                  })),
                })
              }
            />
          }
          showToggle={true}
          disabled={!branchesSettings?.prefixByLabel}
          onToggleChange={(open) => updateSettings({ prefixByLabel: open })}
        />
        <FormQueueField
          key="update-cycle"
          indexKey="update-cycle"
          label="Update issue cycle"
          showToggle={true}
          disabled={!branchesSettings?.updateCycle}
          onToggleChange={(open) => updateSettings({ updateCycle: open })}
        />
        <FormQueueField
          key="uppercase-issue-identifier"
          indexKey="uppercase-issue-identifier"
          label="Uppercase issue identifier in branch name"
          showToggle={true}
          disabled={!branchesSettings?.uppercaseIssueIdentifier}
          onToggleChange={(open) => updateSettings({ uppercaseIssueIdentifier: open })}
        />
      </Modal.Body>
    </Modal>
  )
}
