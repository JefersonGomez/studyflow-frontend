import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// ✅ Importar solo los iconos específicos (Tree-shaking friendly)
import {
  faGripVertical,
  faBookOpen,
  faCheckCircle,
  faNoteSticky,
  faCalendarDays,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: faGripVertical },
  { to: "/courses", label: "Materias", icon: faBookOpen },
  { to: "/tasks", label: "Tareas", icon: faCheckCircle },
  { to: "/notes", label: "Notas", icon: faNoteSticky },
  { to: "/calendar", label: "Calendario", icon: faCalendarDays },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#141414] border-r border-[#1f1f1f] flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1f1f1f]">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white text-sm font-black">S</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            StudyFlow
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "active bg-emerald-500/10 text-emerald-400 shadow-inner"
                    : "text-gray-400 hover:text-white hover:bg-[#1f1f1f] hover:translate-x-1"
                }`
              }
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="w-5 h-5 transition-colors"
              />
              {item.label}

              {/* ✅ Usa group-[.active] para detectar cuando el padre NavLink tiene la clase 'active' */}
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 transition-opacity duration-200 opacity-0 group-[.active]:opacity-100" />
            </NavLink>
          ))}
        </nav>
        {/* Footer del sidebar */}
        <div className="px-4 py-6 border-t border-[#1f1f1f]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
          >
            <FontAwesomeIcon
              icon={faArrowRightFromBracket}
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
            />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto relative z-0">{children}</main>
    </div>
  );
}
