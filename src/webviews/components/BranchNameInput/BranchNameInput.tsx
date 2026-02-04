import { Input, type InputProps } from "rsuite"

import { BranchIcon } from "../Icons/BranchIcon"

type BranchNameInputProps = Omit<InputProps, "data" | "value" | "placeholder" | "size"> & {
  name: string | undefined
  placeholder?: string
  onChange?: (name: string) => void
  size?: number
  inline?: "text" | "icon"
}

export function BranchNameInput(props: BranchNameInputProps) {
  const { name, placeholder, style, size, onChange, inline, ...inputProps } = props

  if (inline === "text") {
    return (
      <Input
        style={{ fontSize: size, ...style }}
        onChange={(value) => onChange?.(value)}
        value={name || ""}
        placeholder={placeholder || "No branch name"}
        {...inputProps}
        disabled={!onChange}
      />
    )
  } else if (inline === "icon") {
    return <BranchIcon size={size || 14} />
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        ...style,
      }}
    >
      <BranchIcon size={size} />
      <Input
        style={{ fontSize: size }}
        onChange={(value) => onChange?.(value)}
        value={name || ""}
        placeholder={placeholder || "No branch name"}
        {...inputProps}
        disabled={!onChange}
      />
    </div>
  )
}
