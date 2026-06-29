import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNote, deleteNote } from "../api/notes";
import { useNoteSummary } from "../hooks/useNoteSummary";
import { useStudyQuiz } from "../hooks/useStudyQuiz";
import FormattedText from "./FormattedText";
import StudyQuiz from "./StudyQuiz";

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
  onDelete,
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: note.title || "",
    content: note.content || "",
  });
  
  // Estado para controlar las pestañas (solo visible en modo lectura expandido)
  const [activeTab, setActiveTab] = useState("content");

  // Hooks de IA
  const {
    content: displayedContent,
    isSummarized,
    isLoading: isSummarizing,
    error: summaryError,
    toggleSummary,
  } = useNoteSummary(note.id, note.content);

  const {
    questions,
    isLoading: isQuizLoading,
    error: quizError,
    hasGenerated,
    revealAnswer,
    isAnswerRevealed,
    regenerate,
  } = useStudyQuiz(note.id, note.content);

  // Sincronización del formulario
  useEffect(() => {
    setForm({ title: note.title || "", content: note.content || "" });
  }, [note.id]);

  useEffect(() => {
    if (!isEditing) {
      setForm({ title: note.title || "", content: note.content || "" });
    }
  }, [note.title, note.content, isEditing]);

  // Mutaciones
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
              { day: "numeric", month: "short" }
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
                if (onDelete) {
                  onDelete();
                } else {
                  if (window.confirm("¿Eliminar esta nota?"))
                    deleteMutation.mutate();
                }
              }}
              className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center"
            >
              🗑️
            </button>
          </div>

          <span
            className={`text-gray-600 text-xs transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="border-t border-[#1f1f1f] px-4 py-4 bg-[#111111]">
          {isEditing ? (
            /* MODO EDICIÓN */
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
            /* ✅ MODO LECTURA CON PESTAÑAS DE IA */
            <div className="relative">
              {/* Tabs de Navegación */}
              <div className="flex gap-1 mb-4 bg-[#1a1a1a] p-1 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab("content")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "content"
                      ? "bg-[#2a2a2a] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  📄 Contenido
                </button>
                <button
                  onClick={() => {
                    setActiveTab("quiz");
                    if (!hasGenerated) regenerate();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "quiz"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  🧠 Quiz IA
                </button>
              </div>

              {/* Renderizado Condicional por Pestaña */}
              {activeTab === "content" ? (
                <div className="relative">
                  {/* Botón de Resumen con IA */}
                  <button
                    onClick={toggleSummary}
                    disabled={isSummarizing || !note.content}
                    className={`absolute top-0 right-0 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSummarized
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                        : "bg-[#1f1f1f] text-gray-400 border border-[#2a2a2a] hover:text-white hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    {isSummarizing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Resumiendo...
                      </>
                    ) : isSummarized ? (
                      <>✨ Ver Original</>
                    ) : (
                      <>🤖 Resumir con IA</>
                    )}
                  </button>

                  {/* Contenido Formateado */}
                  <div
                    className={`transition-opacity duration-300 pt-8 ${
                      isSummarizing ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    {summaryError ? (
                      <p className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        ⚠️ Error al resumir:{" "}
                        {summaryError.message || "Inténtalo de nuevo"}
                      </p>
                    ) : displayedContent ? (
                      <FormattedText text={displayedContent} />
                    ) : note.content ? (
                      <FormattedText text={note.content} />
                    ) : (
                      <span className="text-gray-600 italic">Nota vacía</span>
                    )}
                  </div>

                  {/* Indicador de compresión */}
                  {isSummarized && !isSummarizing && note.content && (
                    <div className="mt-3 pt-3 border-t border-dashed border-emerald-500/20">
                      <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-wider">
                        ✨ Resumen generado por IA •{" "}
                        {note.content.length > 500 && displayedContent
                          ? `${Math.round(
                              (displayedContent.length / note.content.length) * 100
                            )}% del original`
                          : "Texto condensado"}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Pestaña de Quiz */
                <StudyQuiz
                  questions={questions}
                  isLoading={isQuizLoading}
                  error={quizError}
                  onRegenerate={regenerate}
                  isAnswerRevealed={isAnswerRevealed}
                  onToggleAnswer={revealAnswer}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}