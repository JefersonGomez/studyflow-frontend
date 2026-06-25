import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateTask, deleteTask } from "../api/tasks"

const STATUSES = [
  { key: "pendiente", label: "Pendiente", color: "#f59e0b", bg: "#f59e0b15" },
  { key: "en_progreso", label: "En progreso", color: "#3b82f6", bg: "#3b82f615" },
  { key: "completada", label: "Completada", color: "#10b981", bg: "#10b98115" },
]

function parseDateToInput(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toISODate(dateStr) {
  if (!dateStr) return new Date().toISOString()
  return new Date(dateStr + "T12:00:00").toISOString()
}

export default function TaskCard({ task, courseId }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    dueDate: parseDateToInput(task.dueDate),
  })

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      dueDate: parseDateToInput(task.dueDate),
    })
  }, [task])

  const currentStatus = STATUSES.find((s) => s.key === form.status)
  const isOverdue =
    form.dueDate &&
    new Date(form.dueDate) < new Date() &&
    form.status !== "completada"

  const updateMutation = useMutation({
    mutationFn: (data) => updateTask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", courseId])
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => queryClient.invalidateQueries(["tasks", courseId]),
  })

  const cycleStatus = (e) => {
    e.stopPropagation()
    const currentIndex = STATUSES.findIndex((s) => s.key === form.status)
    const next = STATUSES[(currentIndex + 1) % STATUSES.length]
    const newForm = { ...form, status: next.key }
    setForm(newForm)
    updateMutation.mutate({
      title: newForm.title,
      description: newForm.description,
      status: next.key,
      dueDate: toISODate(newForm.dueDate),
    })
  }

  const handleSave = () => {
    updateMutation.mutate({
      title: form.title,
      description: form.description,
      status: form.status,
      dueDate: toISODate(form.dueDate),
    })
  }

  return (
    <div
      className={`group bg-[#141414] border rounded-2xl transition-all duration-200 overflow-hidden ${
        form.status === "completada"
          ? "border-emerald-500/20 opacity-75"
          : isOverdue
          ? "border-red-500/20"
          : "border-[#1f1f1f] hover:border-[#2f2f2f]"
      }`}
    >
      {/* Fila principal */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        {/* Botón circular de estado */}
        <button
          onClick={cycleStatus}
          className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            borderColor: currentStatus?.color,
            backgroundColor:
              form.status === "completada" ? currentStatus?.color : "transparent",
          }}
        >
          {form.status === "completada" && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4l2.5 2.5L9 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {form.status === "en_progreso" && (
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          )}
        </button>

        {/* Título */}
        <p
          className={`flex-1 text-sm font-medium transition-all duration-200 ${
            form.status === "completada"
              ? "line-through text-gray-500"
              : "text-white"
          }`}
        >
          {form.title}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium hidden group-hover:inline-flex"
            style={{
              backgroundColor: currentStatus?.bg,
              color: currentStatus?.color,
            }}
          >
            {currentStatus?.label}
          </span>

          {isOverdue && (
            <span className="text-xs text-red-400 font-medium">Vencida</span>
          )}

          {form.dueDate && !isOverdue && (
            <span className="text-xs text-gray-600">
              {new Date(form.dueDate + "T12:00:00").toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditing(true)
                setExpanded(true)
              }}
              className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-[#252525] transition-colors flex items-center justify-center text-xs"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteMutation.mutate()
              }}
              className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center text-xs"
            >
              🗑️
            </button>
          </div>

          <span
            className={`text-gray-600 text-xs transition-transform duration-200 ml-1 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-[#1f1f1f] px-4 py-4 bg-[#111111]">
          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 text-xs mb-1.5 block">Título</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs mb-1.5 block">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-600 text-xs mb-1.5 block">Descripción</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Agrega más detalles..."
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-gray-600 text-xs mb-1.5 block">Fecha límite</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setExpanded(false)
                  }}
                  className="bg-[#1f1f1f] hover:bg-[#252525] text-gray-400 text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-gray-500 text-sm">
                {form.description || (
                  <span className="text-gray-700 italic">Sin descripción</span>
                )}
              </p>
              {form.dueDate && (
                <p className="text-xs text-gray-600">
                  Fecha límite:{" "}
                  {new Date(form.dueDate + "T12:00:00").toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}