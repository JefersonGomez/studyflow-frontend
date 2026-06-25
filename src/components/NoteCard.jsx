import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateNote, deleteNote } from "../api/notes"

export default function NoteCard({ note, courseId }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: note.title,
    content: note.content || "",
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updateNote(note.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["notes", courseId])
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteNote(note.id),
    onSuccess: () => queryClient.invalidateQueries(["notes", courseId]),
  })

  return (
    <div className={`group bg-[#141414] border rounded-2xl transition-all duration-200 overflow-hidden
      ${expanded ? "border-[#2a2a2a]" : "border-[#1f1f1f] hover:border-[#2a2a2a]"}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        <div className="w-7 h-7 bg-[#1f1f1f] rounded-lg flex items-center justify-center shrink-0">
          <span className="text-xs">📝</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{form.title}</p>
          {!expanded && (
            <p className="text-gray-600 text-xs truncate mt-0.5">
              {form.content || "Sin contenido"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-gray-700 text-xs">
            {new Date(note.createAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true) }}
              className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-[#252525] transition-colors flex items-center justify-center text-xs"
            >
              ✏️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate() }}
              className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center text-xs"
            >
              🗑️
            </button>
          </div>

          <span className={`text-gray-600 text-xs transition-transform duration-200 ml-1 ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </div>
      </div>

      {/* Contenido expandido */}
      {expanded && (
        <div className="border-t border-[#1f1f1f] px-4 py-4 bg-[#111111]">
          {editing ? (
            <div className="flex flex-col gap-3">
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
                <label className="text-gray-600 text-xs mb-1.5 block">Contenido</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={6}
                  placeholder="Escribe tu nota aquí..."
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-3 text-white text-sm outline-none focus:border-emerald-500/50 transition-colors resize-none leading-relaxed"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate(form)}
                  disabled={updateMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-[#1f1f1f] hover:bg-[#252525] text-gray-400 text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
              {form.content || <span className="text-gray-700 italic">Sin contenido</span>}
            </p>
          )}
        </div>
      )}
    </div>
  )
}