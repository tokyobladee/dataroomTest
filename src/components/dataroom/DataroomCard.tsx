import { useState } from "react"
import { MoreHorizontal, Trash2, FolderOpen } from "lucide-react"
import type { Dataroom } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"

interface Props {
  dataroom: Dataroom
  onSelect: (id: string) => void
}

export function DataroomCard({ dataroom, onSelect }: Props) {
  const { deleteDataroom } = useDataroomStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <>
      <div
        className="group relative flex flex-col gap-3 rounded-lg border bg-card p-5 cursor-pointer hover:border-foreground/20 hover:shadow-sm transition-all"
        onClick={() => onSelect(dataroom.id)}
      >
        <div className="flex items-start justify-between">
          <div className="rounded-md bg-muted p-2">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div>
          <p className="font-medium text-sm">{dataroom.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Created {formatDate(dataroom.createdAt)}
          </p>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{dataroom.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the dataroom and all its folders and files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteDataroom(dataroom.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
