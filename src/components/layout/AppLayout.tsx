import { Sidebar } from "./Sidebar"

interface Props {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppLayout({ sidebar, children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar>{sidebar}</Sidebar>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
