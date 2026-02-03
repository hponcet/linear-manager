import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type SortableProps = {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export function Sortable(props: SortableProps) {
  const { id, children, style: userStyle } = props;

  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    display: "flex",
    alignItems: "center",
    ...userStyle,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
