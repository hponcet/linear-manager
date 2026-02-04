import { useDroppable } from "@dnd-kit/core"

export type DroppableProps = {
  id: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Droppable(props: DroppableProps) {
  const { id, children, style: userStyle } = props

  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  const style = {
    opacity: isOver ? 1 : 0.5,
    ...userStyle,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  )
}
