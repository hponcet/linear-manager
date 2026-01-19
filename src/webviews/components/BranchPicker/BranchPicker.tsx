import { SelectPicker, SelectPickerProps } from "rsuite";
import { Ref } from "src/types/GitAPI";
import { Branch } from "./Branch";

type BranchPickerProps = Omit<SelectPickerProps, "data" | "value" | "size"> & {
  branch: Ref | null;
  branches: Ref[];
  inline?: "text" | "icon";
  size?: number;
};

export function BranchPicker(props: BranchPickerProps) {
  const { branch, branches, placeholder, inline, size, ...selectPickerProps } =
    props;

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
      renderOption={(_, item) => (
        <Branch branch={item.branch} style={{ marginRight: 8 }} />
      )}
      renderValue={(_, item) =>
        item ? (
          <Branch
            branch={item.branch}
            style={{ marginRight: 8 }}
            inline={inline}
            size={size}
          />
        ) : null
      }
      groupBy="type"
      renderOptionGroup={(title, item) => (title === "1" ? "Origin" : "Local")}
      {...selectPickerProps}
    />
  );
}
