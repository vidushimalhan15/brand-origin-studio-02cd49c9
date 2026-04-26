import { LayoutDashboard, Target, PenTool, Rocket, Settings, Lightbulb } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Brand Setup", icon: Target, path: "/" },
  { name: "Content Strategy", icon: PenTool, path: "/strategy" },
  { name: "Campaigns", icon: Rocket, path: "/campaigns" },
  { name: "Post Ideation", icon: Lightbulb, path: "/post-ideation" },
] as const;

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen bg-slate-50 antialiased">
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">SocialFlow</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-500 text-sm font-medium hover:bg-slate-50 rounded-lg cursor-pointer transition-all">
            <Settings className="w-4 h-4" />
            Settings
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
