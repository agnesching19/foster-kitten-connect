import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { SidebarNav } from './SidebarNav'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh">
      <SidebarNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-8 md:pt-8 lg:px-10">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
