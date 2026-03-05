import { useState } from "react"
import { FolderOpen } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { Button } from "@/components/ui/button"
import { DataroomCard } from "@/components/dataroom/DataroomCard"
import { CreateDataroomDialog } from "@/components/dataroom/CreateDataroomDialog"

export function DataroomSelectionPage() {
  const { datarooms, createDataroom, setActiveDataroom } = useDataroomStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleCreate(name: string) {
    await createDataroom(name)
  }

  async function handleSelect(id: string) {
    await setActiveDataroom(id)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Datarooms</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select a dataroom to open or create a new one
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>New dataroom</Button>
        </div>

        {datarooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No datarooms yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a dataroom to get started
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              Create your first dataroom
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datarooms.map((dr) => (
              <DataroomCard key={dr.id} dataroom={dr} onSelect={handleSelect} />
            ))}
          </div>
        )}

        <CreateDataroomDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreate={handleCreate}
        />
      </div>
    </div>
  )
}
