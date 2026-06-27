import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNote, deleteNote } from "../api/notes";

export default function NoteCard({
  note,
  courseId,
  courseName,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onCancelEdit,
  onSaved,
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: note.title || "",
    content: note.content || "",
  });

  useEffect(() => {
    setForm({ title: note.title || "", content: note.content || "" });
  }, [note.id]);
  useEffect(() => {
    if (!isEditing) {
      setForm({ title: note.title || "", content: note.content || "" });
    }
  }, [note.title, note.content, isEditing]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateNote(note.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", courseId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
      onSaved?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", courseId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
    },
  });

  return (
    <div
      className={`bg-[#141414] border rounded-2xl transition-all duration-200 overflow-hidden ${
        isExpanded
          ? "border-emerald-500/30"
          : "border-[#1f1f1f] hover:border-[#2a2a2a]"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none group"
        onClick={() => !isEditing && onToggle?.()}
      >
        <div className="w-8 h-8 bg-[#1f1f1f] rounded-lg flex items-center justify-center shrink-0 text-sm">
          📝
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{note.title}</p>
          {courseName && (
            <p className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider mt-0.5 truncate">
              {courseName}
            </p>
          )}
          {!isExpanded && (
            <p className="text-gray-500 text-xs truncate mt-1">
              {note.content?.substring(0, 60) || "Sin contenido..."}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-gray-600 text-[10px]">
            {new Date(note.createAt || note.createdAt).toLocaleDateString(
              "es-ES",
              {
                day: "numeric",
                month: "short",
              },
            )}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="w-7 h-7 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("¿Eliminar esta nota?"))
                  deleteMutation.mutate();
              }}
              className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center"
            >
              🗑️
            </button>
          </div>

          <span
            className={`text-gray-600 text-xs transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="border-t border-[#1f1f1f] px-4 py-4 bg-[#111111]">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                  Título
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                  Contenido
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={8}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate(form)}
                  disabled={updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>
                <button
                  onClick={() => {
                    setForm({ title: note.title, content: note.content });
                    onCancelEdit?.();
                  }}
                  className="bg-[#1f1f1f] hover:bg-[#252525] text-gray-400 text-xs px-5 py-2 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {note.content || (
                <span className="text-gray-600 italic">Nota vacía</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
