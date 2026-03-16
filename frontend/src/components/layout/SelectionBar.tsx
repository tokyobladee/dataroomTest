import { useState } from "react"
import { Trash2, X, Download } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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

interface Props {
  confirmOpen?: boolean
  onConfirmOpenChange?: (open: boolean) => void
}

export function SelectionBar({ confirmOpen: externalOpen, onConfirmOpenChange }: Props) {
  const { selectedIds, clearSelection, deleteSelected, downloadSelectionAsZip, myRole } = useDataroomStore()
  const canEdit = myRole === "owner" || myRole === "editor"
  const [internalOpen, setInternalOpen] = useState(false)

  const confirmOpen = externalOpen ?? internalOpen
  const setConfirmOpen = onConfirmOpenChange ?? setInternalOpen

  if (selectedIds.length === 0) return null

  async function handleDelete() {
    const count = selectedIds.length
    await deleteSelected()
    setConfirmOpen(false)
    toast.success(`${count} item${count > 1 ? "s" : ""} deleted`)
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border bg-card shadow-lg px-3 py-2 mr-20">
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => toast.promise(downloadSelectionAsZip(), { loading: "Preparing ZIP…", success: "Downloaded", error: "Failed to download" })}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        {canEdit && (
          <>
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
          </>
        )}
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
              variant="destructive"
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
