import { LayoutDashboard, Target, PenTool, Rocket, Settings, Lightbulb, FileText } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import centerIcon from "@/assets/center-icon.png";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Brand Setup", icon: Target, path: "/brand-setup" },
  { name: "Content Strategy", icon: PenTool, path: "/strategy" },
  { name: "Campaigns", icon: Rocket, path: "/campaigns" },
  { name: "Post Ideation", icon: Lightbulb, path: "/post-ideation" },
  { name: "Post Generation", icon: FileText, path: "/post-generation" },
] as const;

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isNanoBananaActive = pathname === "/image-generation";

  return (
    <div className="flex min-h-screen bg-slate-50 antialiased">
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 no-underline group">
            <img src={centerIcon} alt="SocialFlow logo" className="w-7 h-7 object-contain" />
            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight group-hover:text-indigo-500 transition-colors">SocialFlow</h1>
          </Link>
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

          {/* Nano Banana — special colourful entry */}
          <Link
            to="/image-generation"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              isNanoBananaActive
                ? "bg-gradient-to-r from-pink-50 via-yellow-50 to-purple-50 text-pink-600"
                : "text-slate-600 hover:bg-gradient-to-r hover:from-pink-50 hover:via-yellow-50 hover:to-purple-50 hover:text-pink-600"
            }`}
          >
            {/* Animated sparkle emoji icon */}
            <span
              className="text-base leading-none"
              style={{ filter: "drop-shadow(0 0 4px rgba(236,72,153,0.5))" }}
            >
              ✦
            </span>
            <span
              style={{
                background: "linear-gradient(90deg, #ec4899, #f59e0b, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Nano Banana Pro
            </span>
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                color: "#fff",
                WebkitTextFillColor: "#fff",
              }}
            >
              AI
            </span>
          </Link>
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
