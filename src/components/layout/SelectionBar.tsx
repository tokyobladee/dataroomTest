import { useState } from "react"
import { Trash2, X } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SelectionBar() {
  const { selectedIds, clearSelection, deleteSelected } = useDataroomStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (selectedIds.length === 0) return null

  async function handleDelete() {
    await deleteSelected()
    setConfirmOpen(false)
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-card shadow-lg px-4 py-3">
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Selected folders and files will be permanently deleted, including all their contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
