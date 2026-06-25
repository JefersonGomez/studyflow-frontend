import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/courses", label: "Materias", icon: "📚" },
  { to: "/tasks", label: "Tareas", icon: "✓" },
  { to: "/notes", label: "Notas", icon: "📝" },
  { to: "/calendar", label: "Calendario", icon: "📅" },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout  = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#141414] border-r border-[#1f1f1f] flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1f1f1f]">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="text-white font-semibold text-base">StudyFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-medium"
                    : "text-gray-400 hover:text-white hover:bg-[#1f1f1f]"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-3 py-4 border-t border-[#1f1f1f]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition-colors duration-150"
          >
            <span className="text-base">→</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
