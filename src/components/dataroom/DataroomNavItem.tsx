import { useState } from "react"
import { ChevronRight, Database, MoreHorizontal, Trash2 } from "lucide-react"
import type { Dataroom } from "@/types"
import { useDataroomStore } from "@/stores/dataroomStore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { FolderTree } from "@/components/folder/FolderTree"

interface Props {
  dataroom: Dataroom
}

export function DataroomNavItem({ dataroom }: Props) {
  const { activeDataroomId, expandedDataroomIds, setActiveDataroom, toggleDataroomExpanded, deleteDataroom } = useDataroomStore()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isActive = activeDataroomId === dataroom.id
  const isExpanded = expandedDataroomIds.includes(dataroom.id)

  async function handleClick() {
    if (!isActive) {
      await setActiveDataroom(dataroom.id)
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1.5 px-2 cursor-pointer select-none text-sm hover:bg-accent",
          isActive && "bg-accent font-medium"
        )}
        onClick={handleClick}
      >
        <button
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )}
          onClick={async (e) => {
            e.stopPropagation()
            if (!isActive) await setActiveDataroom(dataroom.id)
            else toggleDataroomExpanded(dataroom.id)
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <Database className="h-4 w-4 shrink-0 text-muted-foreground" />

        <span className="flex-1 truncate ml-1">{dataroom.name}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div className="pl-3">
          <FolderTree />
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
    </div>
  )
}
