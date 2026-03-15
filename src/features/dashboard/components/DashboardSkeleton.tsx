/**
 * Skeleton de carga del dashboard — replica fielmente el layout real
 * para evitar saltos visuales (FOUC) durante la hidratación.
 *
 * Se usa tanto en loading.tsx (SSR) como en ModernDashboardWrapper (auth loading).
 * No tiene "use client" — compatible con Server Components.
 *
 * @module features/dashboard/components
 */

import { Skeleton } from "@/components/ui/skeleton";

// ─── Sidebar skeleton ──────────────────────────────────────────

export function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0 w-64 bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-200">
        <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
        <Skeleton className="h-5 w-32 rounded-md" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {[44, 36, 36, 36, 36, 36, 36].map((w, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md">
            <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
            <Skeleton className={`h-4 rounded-md`} style={{ width: `${w}%` }} />
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── TopBar skeleton ───────────────────────────────────────────

export function TopBarSkeleton() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0">
      {/* Hamburger (mobile) */}
      <Skeleton className="w-8 h-8 rounded-md lg:hidden" />
      <div className="flex-1" />
      {/* Right side: bell + avatar */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full hidden sm:block" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </header>
  );
}

// ─── Page content skeleton (mirrors DashboardWelcome) ──────────

export function DashboardContentSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-7 lg:py-10 space-y-6 sm:space-y-8">

      {/* Hero header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Store logo */}
            <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex-shrink-0" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-7 w-48 sm:w-64 rounded-lg" />
              <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>
          </div>
          {/* Status pills */}
          <div className="flex gap-2 flex-shrink-0">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <section className="space-y-3">
        <Skeleton className="h-3.5 w-36 rounded-md" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-3 w-14 rounded-md" />
                </div>
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="space-y-3">
        <Skeleton className="h-3.5 w-32 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section cards */}
      <section className="space-y-3">
        <Skeleton className="h-3.5 w-40 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

// ─── Generic page skeleton (used by loading.tsx — applies to ALL sub-routes) ──
// Neutral enough to work on any page: sells, products, settings, etc.

export function GenericPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl flex-shrink-0" />
      </div>

      {/* Content block — generic rows */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 sm:px-6 py-4">
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Skeleton className="h-4 rounded-md" style={{ width: `${55 + (i % 3) * 15}%` }} />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
              <Skeleton className="h-4 w-16 rounded-md flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Full layout skeleton (sidebar + topbar + content) ─────────

export function DashboardFullSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBarSkeleton />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
          <DashboardContentSkeleton />
        </main>
      </div>
    </div>
  );
}
