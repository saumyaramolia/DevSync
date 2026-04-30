"use client";

import { useUIStore } from "@/store/ui";
import { PanelLeft, PanelLeftClose, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Workspaces", icon: LayoutDashboard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3">
        {!isSidebarCollapsed && (
          <span className="overflow-hidden text-sm font-semibold text-slate-900 transition-all duration-200">
            DevSync
          </span>
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex h-9 items-center gap-3 rounded-md px-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
