import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDataroomStore } from "@/stores/dataroomStore"
import type { ZipConflict } from "@/lib/downloadZip"

type Resolution = "copy" | "skip"

export function ZipConflictDialog() {
  const pendingZip = useDataroomStore((s) => s.pendingZip)
  const cancelZipDownload = useDataroomStore((s) => s.cancelZipDownload)
  const confirmZipDownload = useDataroomStore((s) => s.confirmZipDownload)

  const open = pendingZip !== null
  const conflicts: ZipConflict[] = pendingZip?.conflicts ?? []

  // Map from entryIndex → user choice; default is "copy"
  const [choices, setChoices] = useState<Map<number, Resolution>>(new Map())

  // Reset choices whenever the dialog opens with a new set of conflicts
  useEffect(() => {
    if (open) {
      const defaults = new Map<number, Resolution>()
      for (const c of conflicts) {
        defaults.set(c.entryIndex, "copy")
      }
      setChoices(defaults)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function setChoice(entryIndex: number, resolution: Resolution) {
    setChoices((prev) => {
      const next = new Map(prev)
      next.set(entryIndex, resolution)
      return next
    })
  }

  function handleDownload() {
    const resolutions = new Map<number, string | null>()
    for (const c of conflicts) {
      const choice = choices.get(c.entryIndex) ?? "copy"
      resolutions.set(c.entryIndex, choice === "skip" ? null : c.copyPath)
    }
    confirmZipDownload(resolutions)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) cancelZipDownload() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Duplicate file names</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          The following files share a name with an earlier entry in the ZIP. Choose what to do with each one.
        </p>

        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1 mt-1">
          {conflicts.map((conflict) => {
            const choice = choices.get(conflict.entryIndex) ?? "copy"
            return (
              <div key={conflict.entryIndex} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium truncate" title={conflict.displayPath}>
                  {conflict.displayPath}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={choice === "copy" ? "outline" : "ghost"}
                    className="flex-1 justify-start text-xs"
                    onClick={() => setChoice(conflict.entryIndex, "copy")}
                  >
                    Keep as copy
                    <span className="ml-1 truncate text-muted-foreground" title={conflict.copyPath}>
                      ({conflict.copyPath.split("/").pop()})
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant={choice === "skip" ? "outline" : "ghost"}
                    className="flex-1 justify-start text-xs"
                    onClick={() => setChoice(conflict.entryIndex, "skip")}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={cancelZipDownload}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
