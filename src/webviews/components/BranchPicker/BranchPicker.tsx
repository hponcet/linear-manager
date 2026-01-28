import { SelectPicker, SelectPickerProps } from "rsuite";
import { Ref } from "src/types/GitAPI";
import { Branch } from "./Branch";

type BranchPickerProps = Omit<
  SelectPickerProps,
  "data" | "value" | "size" | "onChange"
> & {
  branch: Ref | null;
  branches: Ref[];
  inline?: "text" | "icon";
  currentBranch?: Ref | null;
  size?: number;
  onChange?: (branch: Ref | null) => void;
};

export function BranchPicker(props: BranchPickerProps) {
  const {
    branch,
    branches,
    currentBranch,
    placeholder,
    inline,
    size,
    onChange,
    ...selectPickerProps
  } = props;

  const data = branches
    .map((b) => ({
      label: b.name!,
      value: b.name,
      type: b.type as number,
      branch: b,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <SelectPicker
      data={data}
      value={branch?.name || null}
      placeholder={placeholder || "Select a branch"}
      cleanable={false}
      onChange={(value) => {
        onChange?.(data.find((d) => d.value === value)!.branch || null);
      }}
      renderOption={(_, item) => (
        <Branch
          branch={item.branch}
          currentBranch={currentBranch}
          style={{ marginRight: 8 }}
        />
      )}
      renderValue={(_, item) =>
        item ? (
          <Branch
            branch={item.branch}
            currentBranch={currentBranch}
            inline={inline}
            size={size}
            style={{ marginRight: 8 }}
          />
        ) : null
      }
      groupBy="type"
      renderOptionGroup={(title, item) => (title === "1" ? "Origin" : "Local")}
      {...selectPickerProps}
    />
  );
}
