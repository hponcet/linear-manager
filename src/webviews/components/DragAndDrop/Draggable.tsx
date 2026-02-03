import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export type DraggableProps = {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export function Draggable(props: DraggableProps) {
  const { id, children, style: userStyle } = props;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    ...userStyle,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
