import { useState, useEffect } from "react"
import { useDataroomStore } from "@/stores/dataroomStore"
import type { ConflictResolution } from "@/lib/fileConflicts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ActionType = "copy" | "rename" | "skip"

interface RowState {
  action: ActionType
  renameValue: string
}

export function FileConflictDialog() {
  const { pendingFileConflicts, resolveFileConflicts, cancelFileConflicts } = useDataroomStore()
  const open = pendingFileConflicts !== null
  const conflicts = pendingFileConflicts?.conflicts ?? []

  const [rows, setRows] = useState<Record<string, RowState>>({})

  // Reset row state whenever the dialog opens with new conflicts
  useEffect(() => {
    if (open && conflicts.length > 0) {
      const initial: Record<string, RowState> = {}
      for (const c of conflicts) {
        initial[c.id] = { action: "copy", renameValue: c.fileName }
      }
      setRows(initial)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function setAction(id: string, action: ActionType) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], action } }))
  }

  function setRenameValue(id: string, value: string) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], renameValue: value } }))
  }

  const confirmDisabled = conflicts.some((c) => {
    const row = rows[c.id]
    return row?.action === "rename" && row.renameValue.trim() === ""
  })

  function handleConfirm() {
    const resolutions = new Map<string, ConflictResolution>()
    for (const c of conflicts) {
      const row = rows[c.id]
      if (!row) continue
      if (row.action === "skip") {
        resolutions.set(c.id, { action: "skip" })
      } else if (row.action === "copy") {
        resolutions.set(c.id, { action: "copy" })
      } else if (row.action === "rename") {
        resolutions.set(c.id, { action: "rename", newName: row.renameValue.trim() })
      }
    }
    resolveFileConflicts(resolutions)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) cancelFileConflicts() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {conflicts.length === 1
              ? "1 file already exists"
              : `${conflicts.length} files already exist`}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-1">
          Choose what to do with each conflicting file.
        </p>

        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          {conflicts.map((conflict) => {
            const row = rows[conflict.id] ?? { action: "copy", renameValue: conflict.fileName }
            return (
              <div key={conflict.id} className="flex flex-col gap-2">
                <p className="text-sm font-medium truncate" title={conflict.fileName}>
                  {conflict.fileName}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={row.action === "copy" ? "outline" : "ghost"}
                    className="flex-1 text-xs"
                    onClick={() => setAction(conflict.id, "copy")}
                  >
                    Keep as copy
                  </Button>
                  <Button
                    size="sm"
                    variant={row.action === "rename" ? "outline" : "ghost"}
                    className="flex-1 text-xs"
                    onClick={() => setAction(conflict.id, "rename")}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant={row.action === "skip" ? "outline" : "ghost"}
                    className="flex-1 text-xs"
                    onClick={() => setAction(conflict.id, "skip")}
                  >
                    Skip
                  </Button>
                </div>

                {row.action === "copy" && (
                  <p className="text-xs text-muted-foreground pl-1">
                    Will be saved as &ldquo;{conflict.copyName}&rdquo;
                  </p>
                )}

                {row.action === "rename" && (
                  <input
                    value={row.renameValue}
                    onChange={(e) => setRenameValue(conflict.id, e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter new file name"
                    autoFocus
                  />
                )}
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={cancelFileConflicts}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={confirmDisabled}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
