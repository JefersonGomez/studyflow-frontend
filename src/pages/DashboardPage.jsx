import { useQuery } from "@tanstack/react-query"
import { getCourses } from "../api/courses"
import { getMe, getStats, getUpcomingTasks } from "../api/auth"
import Layout from "../components/Layout"
import { useNavigate } from "react-router-dom"

const STATUS_COLORS = {
  pendiente: { color: "#f59e0b", bg: "#f59e0b15", label: "Pendiente" },
  en_progreso: { color: "#3b82f6", bg: "#3b82f615", label: "En progreso" },
  completada: { color: "#10b981", bg: "#10b98115", label: "Completada" },
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe().then((r) => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => getStats().then((r) => r.data),
  })

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming"],
    queryFn: () => getUpcomingTasks().then((r) => r.data),
  })

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses().then((r) => r.data),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Buenos días"
    if (h < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  const firstName = user?.name?.split(" ")[0] || ""

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Hoy"
    if (days === 1) return "Mañana"
    if (days < 0) return "Vencida"
    return `En ${days} días`
  }

  return (
    <Layout>
      <div className="p-8">

        {/* Header saludo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                referrerPolicy="no-referrer"
                alt="avatar"
                className="w-10 h-10 rounded-full border border-[#2a2a2a]"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {greeting()}, {firstName} 👋
              </h1>
              <p className="text-gray-600 text-xs mt-0.5">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long", day: "numeric", month: "long"
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Materias",
              value: stats?.courses ?? "—",
              icon: "📚",
              color: "#10b981",
              bg: "#10b98112",
              onClick: () => navigate("/courses"),
            },
            {
              label: "Tareas totales",
              value: stats?.tasks ?? "—",
              icon: "✅",
              color: "#3b82f6",
              bg: "#3b82f612",
            },
            {
              label: "Pendientes",
              value: stats?.pending ?? "—",
              icon: "⏳",
              color: "#f59e0b",
              bg: "#f59e0b12",
            },
            {
              label: "Notas",
              value: stats?.notes ?? "—",
              icon: "📝",
              color: "#8b5cf6",
              bg: "#8b5cf612",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className={`bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200
                ${stat.onClick ? "cursor-pointer hover:border-[#2a2a2a] hover:-translate-y-0.5" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{ backgroundColor: stat.bg }}
                >
                  {stat.icon}
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Grid inferior */}
        <div className="grid grid-cols-5 gap-4">

          {/* Próximas tareas */}
          <div className="col-span-3 bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">Próximas tareas</h2>
              <span className="text-gray-600 text-xs">{upcoming?.length || 0} tareas</span>
            </div>

            {!upcoming || upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-4xl mb-2">🎉</p>
                <p className="text-gray-500 text-sm">Sin tareas pendientes</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((task) => {
                  const urgency = daysUntil(task.dueDate)
                  const isUrgent = urgency === "Hoy" || urgency === "Mañana" || urgency === "Vencida"
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#111111] border border-[#1a1a1a] hover:border-[#252525] transition-colors"
                    >
                      <div
                        className="w-1.5 h-8 rounded-full shrink-0"
                        style={{
                          backgroundColor: isUrgent ? "#ef4444" : STATUS_COLORS[task.status]?.color
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{task.title}</p>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                          style={{
                            backgroundColor: STATUS_COLORS[task.status]?.bg,
                            color: STATUS_COLORS[task.status]?.color,
                          }}
                        >
                          {STATUS_COLORS[task.status]?.label}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          isUrgent ? "text-red-400" : "text-gray-500"
                        }`}
                      >
                        {urgency}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Materias */}
          <div className="col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">Materias</h2>
              <button
                onClick={() => navigate("/courses")}
                className="text-emerald-400 hover:text-emerald-300 text-xs transition-colors"
              >
                Ver todas →
              </button>
            </div>

            {!courses || courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-500 text-sm">Sin materias</p>
                <button
                  onClick={() => navigate("/courses")}
                  className="mt-2 text-emerald-400 text-xs hover:text-emerald-300 transition-colors"
                >
                  Crear materia →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {courses.slice(0, 6).map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#111111] border border-[#1a1a1a] hover:border-[#252525] transition-all cursor-pointer hover:-translate-y-0.5 duration-200"
                  >
                    <div
                      className="w-7 h-7 rounded-lg shrink-0"
                      style={{ backgroundColor: course.color || "#10b981" }}
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{course.name}</p>
                      {course.description && (
                        <p className="text-gray-600 text-xs truncate">{course.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}