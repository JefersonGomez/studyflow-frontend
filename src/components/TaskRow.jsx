import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask, deleteTask } from "../api/tasks";

const STATUSES = [
  { key: "pendiente", label: "Pendiente", color: "#f59e0b", bg: "#f59e0b15" },
  {
    key: "en_progreso",
    label: "En progreso",
    color: "#3b82f6",
    bg: "#3b82f615",
  },
  { key: "completada", label: "Completada", color: "#10b981", bg: "#10b98115" },
];

function parseDateToInput(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toISODate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  return new Date(dateStr + "T12:00:00").toISOString();
}

export default function TaskRow({
  task,
  index,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onCancelEdit,
  onSaved,
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    dueDate: parseDateToInput(task.dueDate),
  });

  useEffect(() => {
    if (!isEditing) {
      setForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        dueDate: parseDateToInput(task.dueDate),
      });
    }
  }, [task.id]);

  const currentStatus = STATUSES.find((s) => s.key === form.status);
  const isOverdue =
    form.dueDate &&
    new Date(form.dueDate) < new Date() &&
    form.status !== "completada";

  const updateMutation = useMutation({
    mutationFn: (data) => updateTask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-tasks"]);
      queryClient.invalidateQueries(["tasks", task.courseId]);
      onSaved?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-tasks"]);
      queryClient.invalidateQueries(["tasks", task.courseId]);
    },
  });

  const cycleStatus = (e) => {
    e.stopPropagation();
    const idx = STATUSES.findIndex((s) => s.key === form.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    const newForm = { ...form, status: next.key };
    setForm(newForm);
    updateMutation.mutate({
      title: newForm.title,
      description: newForm.description,
      status: next.key,
      dueDate: toISODate(newForm.dueDate),
    });
  };

  return (
    <div
      className="border-b border-[#1f1f1f] last:border-0 transition-colors duration-150 hover:bg-[#1a1a1a] group"
      style={{
        animation: `fadeSlideIn 0.100s cubic-bezier(0.16, 1, 0.3, 1) forwards`, // Más lento + curva suave
        animationDelay: `${index * 100}ms`, // Retraso aumentado para que no se solapen
        opacity: 0,
      }}
    >
      {/* Fila principal */}
      <div
        className="grid grid-cols-12 gap-4 px-5 py-3.5 cursor-pointer items-center"
        onClick={() => !isEditing && onToggle?.()}
      >
        {/* Botón de estado */}
        <div className="col-span-1 flex items-center">
          <button
            onClick={cycleStatus}
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 shrink-0"
            style={{
              borderColor: currentStatus?.color,
              backgroundColor:
                form.status === "completada"
                  ? currentStatus?.color
                  : "transparent",
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
        </div>

        {/* Título */}
        <div className="col-span-4 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              form.status === "completada"
                ? "line-through text-gray-500"
                : "text-white"
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-gray-600 text-xs truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        {/* Materia */}
        <div className="col-span-2">
          <span className="text-xs text-emerald-400/70 font-semibold uppercase tracking-wider truncate block">
            {task.courseName || "—"}
          </span>
        </div>

        {/* Estado badge */}
        <div className="col-span-2">
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              backgroundColor: currentStatus?.bg,
              color: currentStatus?.color,
            }}
          >
            {currentStatus?.label}
          </span>
        </div>

        {/* Fecha */}
        <div className="col-span-2">
          {form.dueDate ? (
            <span
              className={`text-xs font-medium ${isOverdue ? "text-red-400" : "text-gray-500"}`}
            >
              {isOverdue && "⚠ "}
              {new Date(form.dueDate + "T12:00:00").toLocaleDateString(
                "es-ES",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                },
              )}
            </span>
          ) : (
            <span className="text-gray-700 text-xs">Sin fecha</span>
          )}
        </div>

        {/* Acciones */}
        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-[#252525] flex items-center justify-center text-xs"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate();
            }}
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center text-xs"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div
          className="px-5 pb-4 bg-[#111] border-t border-[#1f1f1f]"
          style={{ animation: "expandDown 0.2s ease forwards" }}
        >
          {isEditing ? (
            <div className="pt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 text-xs mb-1.5 block">
                    Título
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-xs mb-1.5 block">
                    Estado
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
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
                <label className="text-gray-600 text-xs mb-1.5 block">
                  Descripción
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Agrega más detalles..."
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-gray-600 text-xs mb-1.5 block">
                  Fecha límite
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      title: form.title,
                      description: form.description,
                      status: form.status,
                      dueDate: toISODate(form.dueDate),
                    })
                  }
                  disabled={updateMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>
                <button
                  onClick={() => {
                    setForm({
                      title: task.title,
                      description: task.description || "",
                      status: task.status,
                      dueDate: parseDateToInput(task.dueDate),
                    });
                    onCancelEdit?.();
                  }}
                  className="bg-[#1f1f1f] hover:bg-[#252525] text-gray-400 text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 flex flex-col gap-2">
              <p className="text-gray-500 text-sm">
                {task.description || (
                  <span className="text-gray-700 italic">Sin descripción</span>
                )}
              </p>
              {form.dueDate && (
                <p className="text-xs text-gray-600">
                  Fecha límite:{" "}
                  {new Date(form.dueDate + "T12:00:00").toLocaleDateString(
                    "es-ES",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
