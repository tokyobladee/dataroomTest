export const DRAG_ITEM_TYPE = "text/x-dataroom-item"

export interface DraggedItem {
  id: string
  type: "file" | "folder"
}

export function setDragItem(e: React.DragEvent, item: DraggedItem) {
  e.dataTransfer.setData(DRAG_ITEM_TYPE, JSON.stringify(item))
  e.dataTransfer.effectAllowed = "move"
}

export function getDragItem(e: React.DragEvent): DraggedItem | null {
  const data = e.dataTransfer.getData(DRAG_ITEM_TYPE)
  if (!data) return null
  try { return JSON.parse(data) } catch { return null }
}

export function isInternalDrag(e: React.DragEvent) {
  return e.dataTransfer.types.includes(DRAG_ITEM_TYPE)
}
