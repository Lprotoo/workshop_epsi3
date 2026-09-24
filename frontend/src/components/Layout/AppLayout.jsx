import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,167,255,0.08),transparent_28%),linear-gradient(180deg,#05070d,#07101c)] text-white">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
