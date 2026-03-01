import { useLocation, Link } from "react-router-dom";
import { useUiStore } from "../../stores/uiStore";
import { useAuthStore } from "../../stores/authStore";

const baseNavItems = [
  { path: "/dashboard", label: "ダッシュボード", icon: "📊" },
  { path: "/members", label: "メンバー", icon: "👥" },
  { path: "/projects", label: "プロジェクト", icon: "📁" },
  { path: "/budget", label: "予算", icon: "💰" },
];

const adminNavItems = [
  { path: "/users", label: "ユーザー管理", icon: "🔑" },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const user = useAuthStore((state) => state.user);
  const navItems = user?.role === "admin"
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-800 text-white transition-all duration-300 z-30 flex flex-col ${
        sidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="h-16 flex items-center justify-center border-b border-slate-700">
        {!sidebarCollapsed && (
          <span className="text-xl font-bold text-blue-400">TeamBoard</span>
        )}
        {sidebarCollapsed && <span className="text-xl font-bold text-blue-400">T</span>}
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {!sidebarCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="p-4 text-gray-400 hover:text-white border-t border-slate-700"
      >
        {sidebarCollapsed ? "→" : "←"}
      </button>
    </aside>
  );
}
