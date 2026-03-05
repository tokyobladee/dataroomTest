import { ChevronLeft } from "lucide-react"
import { useDataroomStore } from "@/stores/dataroomStore"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Props {
  children: React.ReactNode
}

export function Sidebar({ children }: Props) {
  const { datarooms, activeDataroomId, exitDataroom } = useDataroomStore()
  const dataroom = datarooms.find((d) => d.id === activeDataroomId)

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r bg-background h-screen sticky top-0">
      <div className="flex items-center gap-2 px-3 h-14 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={exitDataroom}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium truncate">{dataroom?.name}</span>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2">{children}</div>
      </ScrollArea>
    </aside>
  )
}
