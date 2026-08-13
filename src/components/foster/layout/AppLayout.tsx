import { Outlet } from '@tanstack/react-router'
import { MobileNav } from './MobileNav'
import { MobileHeader } from './MobileHeader'
import { SidebarNav } from './SidebarNav'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh">
      <SidebarNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 md:hidden">
          <MobileHeader />
          <MobileNav />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-5 md:px-8 md:pt-8 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
