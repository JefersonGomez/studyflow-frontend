import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllNotes, deleteNote } from "../api/notes";
import { getCourses } from "../api/courses";
import Layout from "../components/Layout";
import NoteCard from "../components/NoteCard";
import ConfirmModal from "../components/ConfirmModal";
export default function NotesPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null); // ID de la nota centrada
  const [editingId, setEditingId] = useState(null);
  const queryClient = useQueryClient();
  const [deleteNoteId, setDeleteNoteId] = useState(null);
  const { data: notes, isLoading } = useQuery({
    queryKey: ["all-notes"],
    queryFn: () => getAllNotes().then((r) => r.data),
  });

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries(["all-notes"]);
      setExpandedId(null); // Cerrar si se elimina
    },
  });

  // Bloquear scroll del body cuando hay una nota abierta
  useEffect(() => {
    if (expandedId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [expandedId]);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    if (!search.trim()) return notes;
    const term = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.title?.toLowerCase().includes(term) ||
        n.content?.toLowerCase().includes(term),
    );
  }, [notes, search]);

  const handleDeleteNote = (noteId) => {
    setExpandedId(null);
    setEditingId(null);
    setDeleteNoteId(null);
    setTimeout(() => {
      deleteMutation.mutate(noteId);
    }, 50);
  };

  // Encontrar la nota activa para mostrarla en el centro
  const activeNote = notes?.find((n) => n.id === expandedId);
  const activeCourse = courses?.find((c) => c.id === activeNote?.courseId);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Estilos de animación */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-note-card { animation: fadeSlideUp 0.4s ease-out forwards; opacity: 0; }
        
        /* Animación para el modal central */
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-enter { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Mis Notas
            </h1>
            <p className="text-gray-400 text-sm">
              Tu biblioteca personal de apuntes.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-xl px-4 py-2.5 pl-10 text-white text-sm outline-none focus:border-emerald-500 transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
          </div>
        </div>

        {/* Grid de Notas (Se oscurece si hay una activa) */}
        <div
          className={`transition-opacity duration-300 ${expandedId ? "opacity-20 pointer-events-none blur-[2px]" : "opacity-100"}`}
        >
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#141414] border border-dashed border-[#2a2a2a] rounded-2xl mt-8">
              <span className="text-5xl mb-4 opacity-30 grayscale">📝</span>
              <p className="text-gray-400 font-medium text-lg">
                {search ? "Sin coincidencias" : "Libreta vacía"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredNotes.map((note, index) => {
                const course = courses?.find((c) => c.id === note.courseId);
                return (
                  <div
                    key={`note-${note.id}`}
                    className="animate-note-card"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Usamos un div clickeable que simula la tarjeta para abrir el modal */}
                    <div
                      onClick={() => setExpandedId(note.id)}
                      className="group bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5 hover:border-emerald-500/30 hover:bg-[#1a1a1a] transition-all cursor-pointer h-full flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded-md">
                          {note.courseName || course?.name || "General"}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(note.createAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                        {note.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-3 flex-1">
                        {note.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL CENTRAL (FOCUS MODE) ================= */}
      {expandedId && activeNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => {
            setExpandedId(null);
            setEditingId(null);
          }} // Cerrar al hacer click fuera
        >
          <div
            className="bg-[#141414] border border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl shadow-black/50 animate-modal-enter relative"
            onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer click dentro
          >
            {/* Botón Cerrar Flotante */}
            <button
              onClick={() => {
                setExpandedId(null);
                setEditingId(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 bg-[#1f1f1f] hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-full flex items-center justify-center transition-colors z-10"
            >
              ✕
            </button>

            {/* Contenido de la Nota (Reutilizamos NoteCard pero en modo "Modal") */}
            <div className="p-8">
              <NoteCard
                note={activeNote}
                courseId={activeNote.courseId}
                courseName={activeNote.courseName || activeCourse?.name}
                isExpanded={true} // Forzar expandido
                isEditing={editingId === activeNote.id}
                onEdit={() => setEditingId(activeNote.id)}
                onCancelEdit={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  queryClient.invalidateQueries(["all-notes"]); // Refrescar datos
                }}
                onDelete={() => setDeleteNoteId(activeNote.id)}
                modalMode={true} // Prop opcional para ajustar estilos si quieres
              />
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!deleteNoteId}
        title="¿Eliminar esta nota?"
        message="Esta acción no se puede deshacer."
        onConfirm={() => handleDeleteNote(deleteNoteId)}
        onCancel={() => setDeleteNoteId(null)}
        isPending={deleteMutation.isPending}
      />
    </Layout>
  );
}
