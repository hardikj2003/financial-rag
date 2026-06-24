"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ShieldCheck, Activity } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/documents", label: "Documents", icon: FileText },
    { href: "/admin/observability", label: "Observability", icon: Activity },
  ];

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Core Control Panel Aside */}
        <aside className="w-72 border-r border-slate-200/80 bg-white flex flex-col justify-between p-6">
          <div className="space-y-8">
            {/* Header Identity */}
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                <ShieldCheck size={18} className="text-emerald-500" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                  Terminal HQ
                </h1>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  System Admin
                </p>
              </div>
            </div>

            {/* Navigation System */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold tracking-tight transition-all duration-200 relative ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-emerald-500" />
                    )}
                    <Icon
                      size={16}
                      className={`transition-colors ${
                        isActive
                          ? "text-emerald-400"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Infrastructure Health Status Anchor */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Nominal</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Connected to active production database instances. Nodes are sync
              indexed.
            </p>
          </div>
        </aside>

        {/* Content Viewer viewport frame */}
        <main className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
