import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useEffect, useMemo, useState } from "react"
import { Input, SelectPicker } from "rsuite"
import { SerializedIssue } from "src/types/SerializedLinear"
import { IssueLabelSetting, SettingsVscState } from "src/vscStates"
import { useIssueContext } from "src/webviews/contexts/IssueContext"

import { Button } from "../Button/Button"
import { Sortable } from "../DragAndDrop/Sortable"
import { DeleteIcon } from "../Icons/DeleteIcon"
import { DragIcon } from "../Icons/DragIcon"
import { PlusIcon } from "../Icons/PlusIcon"
import { Label } from "../LabelsPicker/Label"

import "./PrefixByLabelPicker.scss"

type LabelPrefixes = SettingsVscState["prefixByLabelList"]

type PrefixByLabelPickerProps = {
  issue: SerializedIssue
  value: LabelPrefixes
  onChange: (value: LabelPrefixes) => void
}

export function PrefixByLabelPicker(props: PrefixByLabelPickerProps) {
  const { issue, value, onChange } = props

  const { issueLabelsLoading, branchPrefixLabels } = useIssueContext()

  const sensors = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  })

  const pickerLabels = useMemo(() => {
    const byId = new Map<string, (typeof branchPrefixLabels)[number]>()

    for (const label of branchPrefixLabels) {
      byId.set(label.id, label)
    }

    for (const entry of value ?? []) {
      if (entry.label?.id) {
        byId.set(entry.label.id, entry.label)
      }
    }

    return Array.from(byId.values())
  }, [branchPrefixLabels, value])

  const cacheData = useMemo(
    () =>
      pickerLabels
        ?.map((label) => ({
          label: label.name,
          value: label.id,
          issueLabel: label,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .sort((a) => (issue?.labelIds?.includes(a.value) ? -1 : 1)) || [],
    [pickerLabels, issue?.labelIds],
  )

  const [labelsWithPrefixes, setLabelsWithPrefixes] = useState<
    { label: IssueLabelSetting | null; prefix: string }[]
  >(value || [])

  useEffect(() => {
    setLabelsWithPrefixes(value || [])
  }, [value])

  function handleLabelPrefixChange<F extends "label" | "prefix">(
    index: number,
    field: F,
    newValue: F extends "label" ? IssueLabelSetting | null : string,
  ) {
    const updatedList = labelsWithPrefixes.map((item, idx) =>
      idx === index ? { ...item, [field]: newValue } : item,
    )
    setLabelsWithPrefixes(updatedList)
    onChange(
      updatedList.filter((item) => item.label !== null && item.prefix !== "") as LabelPrefixes,
    )
  }

  function handleAddLabelPrefix() {
    const updatedList = [...labelsWithPrefixes, { label: null, prefix: "" }]
    setLabelsWithPrefixes(updatedList)
    onChange(
      updatedList.filter((item) => item.label !== null && item.prefix !== "") as LabelPrefixes,
    )
  }

  function handleRemoveLabelPrefix(index: number) {
    const updatedList = labelsWithPrefixes.filter((_, idx) => idx !== index)
    setLabelsWithPrefixes(updatedList)
    onChange(
      updatedList.filter((item) => item.label !== null && item.prefix !== "") as LabelPrefixes,
    )
  }

  return (
    <div className="prefixByLabelPickerContainer">
      <div className="prefixByLabelPickerHeader">
        <div className="prefixByLabelPickerHeaderPlaceholder" />
        <div className="prefixByLabelPickerHeaderTitles">
          <div>Label</div>
          <div>Branch prefix</div>
        </div>
        <div className="prefixByLabelPickerHeaderPlaceholder">
          <Button onClick={handleAddLabelPrefix} icon={<PlusIcon />} />
        </div>
      </div>
      <DndContext
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={(event) => {
          const { active, over } = event
          if (over && active.id !== over.id) {
            const oldIndex = parseInt(active.id.toString(), 10)
            const newIndex = parseInt(over.id.toString(), 10)
            const updatedList = [...labelsWithPrefixes]
            const [movedItem] = updatedList.splice(oldIndex, 1)
            updatedList.splice(newIndex, 0, movedItem)
            setLabelsWithPrefixes(updatedList)
            onChange(
              updatedList.filter(
                (item) => item.label !== null && item.prefix !== "",
              ) as LabelPrefixes,
            )
          }
        }}
        sensors={[sensors]}
      >
        <div style={{ padding: "8px 0", overflow: "hidden" }}>
          <SortableContext
            items={labelsWithPrefixes.map((_, index) => index.toString())}
            strategy={verticalListSortingStrategy}
          >
            {labelsWithPrefixes.map((item, index) => (
              <Sortable key={index.toString()} id={index.toString()} style={{ padding: "2px 8px" }}>
                <DragIcon style={{ cursor: "grab", marginRight: 8 }} />
                <div className="prefixByLabelPickerRow">
                  <SelectPicker
                    key={`label-prefix-${item.label?.id || index}`}
                    data={cacheData}
                    value={item?.label?.id || null}
                    onChange={(labelId) =>
                      handleLabelPrefixChange(
                        index,
                        "label",
                        cacheData.find((data) => data.value === labelId)?.issueLabel || null,
                      )
                    }
                    placeholder="Select a label"
                    loading={issueLabelsLoading}
                    cleanable={false}
                    renderOption={(_, item) =>
                      item ? <Label key={item.value} issueLabel={item.issueLabel} inline /> : null
                    }
                    renderValue={(_, item) =>
                      item ? (
                        <Label
                          key={item.value}
                          issueLabel={item.issueLabel}
                          inline={true}
                          size={14}
                        />
                      ) : null
                    }
                    style={{ flex: 1 }}
                  />
                  <Input
                    key={`prefix-input-${item.label?.id || index}`}
                    type="text"
                    placeholder="Prefix"
                    value={item.prefix}
                    onChange={(value) => handleLabelPrefixChange(index, "prefix", value)}
                    style={{ flex: 1 }}
                  />
                </div>
                <Button
                  key={`remove-label-prefix-${item.label?.id || index}`}
                  onClick={() => handleRemoveLabelPrefix(index)}
                  icon={<DeleteIcon />}
                />
              </Sortable>
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  )
}
