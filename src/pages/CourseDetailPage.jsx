import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourses } from "../api/courses";
import { getTasksByCourse, createTask, deleteTask } from "../api/tasks";
import { getNotesByCourse, createNote, deleteNote } from "../api/notes";
import FileTab from "../components/FileTab";
import ConfirmModal from "../components/ConfirmModal";
import {
  getEventsByCourse,
  createEvent,
  deleteEvent,
  updateEvent,
} from "../api/events";
import Layout from "../components/Layout";
import TaskCard from "../components/TaskCard";
import NoteCard from "../components/NoteCard";
import CourseWhiteboardTab from "../components/CourseWhiteboardTab";
import { getFilesByCourse, uploadFile, deleteFile } from "../api/files";

const TABS = ["Tareas", "Notas", "Eventos", "Archivos", "Pizarras"];

// Configuración visual de tipos de eventos
const EVENT_TYPES = {
  examen: {
    icon: "📝",
    label: "Examen",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
  },
  quiz: {
    icon: "❓",
    label: "Quiz",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
  proyecto: {
    icon: "🚀",
    label: "Proyecto",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
  },
  laboratorio: {
    icon: "🧪",
    label: "Laboratorio",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
  },
  clase: {
    icon: "📖",
    label: "Clase",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Tareas");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Estados para NoteCard
  const [deleteNoteId, setDeleteNoteId] = useState(null);

  // Estados para TaskCard
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  // Estados para Eventos
  const [deleteEventId, setDeleteEventId] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "pendiente",
    dueDate: "",
  });
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    type: "clase",
    startDate: "",
    endDate: "",
  });

  // Queries
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses().then((r) => r.data),
  });
  const course = courses?.find((c) => c.id === id);

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => getTasksByCourse(id).then((r) => r.data),
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ["notes", id],
    queryFn: () => getNotesByCourse(id).then((r) => r.data),
  });

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["events", id],
    queryFn: () => getEventsByCourse(id).then((r) => r.data),
  });

  const { data: files, isLoading: loadingFiles } = useQuery({
    queryKey: ["files", id],
    queryFn: () => getFilesByCourse(id).then((r) => r.data),
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data) => createTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", id]);
      setShowModal(false);
      setTaskForm({
        title: "",
        description: "",
        status: "pendiente",
        dueDate: "",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", id]);
      setDeleteTaskId(null);
      setExpandedTaskId(null);
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => createNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["notes", id]);
      setShowModal(false);
      setNoteForm({ title: "", content: "" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries(["notes", id]);
      setDeleteNoteId(null);
      setExpandedNoteId(null);
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["events", id]);
      setShowModal(false);
      setEventForm({
        title: "",
        description: "",
        type: "clase",
        startDate: "",
        endDate: "",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      (queryClient.invalidateQueries(["events", id]), setDeleteEventId(null));
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id: eventId, data }) => updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["events", id]);
      setShowModal(false);
      setEditingEvent(null);
      setEventForm({
        title: "",
        description: "",
        type: "clase",
        startDate: "",
        endDate: "",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: (formData) => uploadFile(id, formData),
    onSuccess: () => queryClient.invalidateQueries(["files", id]),
  });
  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => queryClient.invalidateQueries(["files", id]),
  });

  // Handlers
  const handleEditClick = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      type: event.type,
      startDate: event.startDate
        ? new Date(event.startDate).toISOString().split("T")[0]
        : "",
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().split("T")[0]
        : "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "Tareas") {
      createTaskMutation.mutate({
        ...taskForm,
        dueDate: new Date(taskForm.dueDate).toISOString(),
      });
    } else if (activeTab === "Notas") {
      createNoteMutation.mutate(noteForm);
    } else if (activeTab === "Eventos") {
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type,
        startDate: new Date(eventForm.startDate + "T12:00:00").toISOString(),
        endDate: eventForm.endDate
          ? new Date(eventForm.endDate + "T12:00:00").toISOString()
          : null,
        courseID: id,
      };
      if (editingEvent) {
        updateEventMutation.mutate({ id: editingEvent.id, data: eventData });
      } else {
        createEventMutation.mutate(eventData);
      }
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/courses")}
            className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Materias
          </button>
          <span className="text-gray-700">/</span>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg shadow-lg"
              style={{ backgroundColor: course?.color || "#10b981" }}
            />
            <h1 className="text-white font-bold text-2xl tracking-tight">
              {course?.name || "Materia"}
            </h1>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-1 mb-8 bg-[#141414] border border-[#1f1f1f] rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#1f1f1f] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm font-medium">
            {activeTab === "Tareas" &&
              `${tasks?.length || 0} tareas pendientes`}
            {activeTab === "Notas" && `${notes?.length || 0} notas guardadas`}
            {activeTab === "Eventos" &&
              `${events?.length || 0} eventos programados`}
            {activeTab === "Archivos" &&
              `${files?.length || 0} archivos subidos`}
          </p>
          {(activeTab === "Tareas" ||
            activeTab === "Notas" ||
            activeTab === "Eventos") && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setShowModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
            >
              <span>+</span> Agregar{" "}
              {activeTab === "Tareas"
                ? "tarea"
                : activeTab === "Notas"
                  ? "nota"
                  : "evento"}
            </button>
          )}
        </div>

        {/* TAB: TAREAS */}
        {activeTab === "Tareas" && (
          <div className="flex flex-col gap-3 max-w-3xl">
            {loadingTasks ? (
              <p className="text-gray-500 animate-pulse">Cargando tareas...</p>
            ) : tasks?.length === 0 ? (
              <EmptyState message="No hay tareas aún. ¡Agrega tu primera tarea!" />
            ) : (
              tasks?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  courseId={id}
                  isExpanded={expandedTaskId === task.id}
                  isEditing={editingTaskId === task.id}
                  onToggle={() =>
                    setExpandedTaskId(
                      expandedTaskId === task.id ? null : task.id,
                    )
                  }
                  onEdit={() => {
                    setEditingTaskId(task.id);
                    setExpandedTaskId(task.id);
                  }}
                  onCancelEdit={() => {
                    setEditingTaskId(null);
                    setExpandedTaskId(null);
                  }}
                  onSaved={() => setEditingTaskId(null)}
                  onDelete={() => setDeleteTaskId(task.id)}
                />
              ))
            )}
          </div>
        )}

        {/* TAB: NOTAS */}
        {activeTab === "Notas" && (
          <div className="flex flex-col gap-3 max-w-3xl">
            {loadingNotes ? (
              <p className="text-gray-500 animate-pulse">Cargando notas...</p>
            ) : notes?.length === 0 ? (
              <EmptyState message="No hay notas aún. Toma apuntes de esta materia." />
            ) : (
              notes?.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  courseId={id}
                  isExpanded={expandedNoteId === note.id}
                  isEditing={editingNoteId === note.id}
                  onToggle={() =>
                    setExpandedNoteId(
                      expandedNoteId === note.id ? null : note.id,
                    )
                  }
                  onEdit={() => {
                    setEditingNoteId(note.id);
                    setExpandedNoteId(note.id);
                  }}
                  onCancelEdit={() => {
                    setEditingNoteId(null);
                    setExpandedNoteId(null);
                  }}
                  onSaved={() => setEditingNoteId(null)}
                  onDelete={() => setDeleteNoteId(note.id)}
                />
              ))
            )}
          </div>
        )}
        {/* TAB: EVENTOS - DISEÑO MODERNO DE TARJETAS */}
        {activeTab === "Eventos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loadingEvents ? (
              <p className="text-gray-500 col-span-full animate-pulse">
                Cargando eventos...
              </p>
            ) : !events || events.length === 0 ? (
              <div className="col-span-full">
                <EmptyState message="No hay eventos programados. Agrega exámenes, clases o proyectos." />
              </div>
            ) : (
              events.map((event) => {
                const typeConfig = EVENT_TYPES[event.type] || EVENT_TYPES.clase;
                const dateObj = new Date(event.startDate);
                const day = dateObj.getDate();
                const month = dateObj
                  .toLocaleDateString("es-ES", { month: "short" })
                  .toUpperCase();

                return (
                  <div
                    key={event.id}
                    className="group relative bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5 hover:border-[#2a2a2a] hover:shadow-xl hover:shadow-black/20 transition-all duration-300 overflow-hidden"
                  >
                    {/* Acento lateral de color */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: typeConfig.color }}
                    />

                    <div className="flex gap-4">
                      {/* Bloque de fecha */}
                      <div
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0"
                        style={{ backgroundColor: typeConfig.bg }}
                      >
                        <span
                          className="text-xl font-black leading-none"
                          style={{ color: typeConfig.color }}
                        >
                          {day}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider mt-1"
                          style={{ color: typeConfig.color }}
                        >
                          {month}
                        </span>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-white font-bold text-base truncate leading-tight">
                            {event.title}
                          </h3>
                          <span
                            className="text-lg shrink-0"
                            title={typeConfig.label}
                          >
                            {typeConfig.icon}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: typeConfig.bg,
                              color: typeConfig.color,
                            }}
                          >
                            {typeConfig.label}
                          </span>
                          {event.endDate && (
                            <span className="text-gray-600 text-xs">
                              →{" "}
                              {new Date(event.endDate).toLocaleDateString(
                                "es-ES",
                                { day: "numeric", month: "short" },
                              )}
                            </span>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones (aparecen en hover) */}
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditClick(event)}
                        className="w-7 h-7 rounded-lg bg-[#1a1a1a] hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 flex items-center justify-center transition-colors text-xs"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteEventId(event.id)}
                        className="w-7 h-7 rounded-lg bg-[#1a1a1a] hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors text-xs"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: ARCHIVOS */}
        {activeTab === "Archivos" && (
          <FileTab
            files={files}
            loadingFiles={loadingFiles}
            courseId={id}
            onUpload={(formData) => uploadFileMutation.mutate(formData)}
            onDelete={(fileId) => deleteFileMutation.mutate(fileId)}
            isUploading={uploadFileMutation.isPending}
            onEventsCreated={() => {
              queryClient.invalidateQueries({
                queryKey: ["course-events", id],
              });
            }}
          />
        )}
        {/* TAB: Pizara */}
        {activeTab === "Pizarras" && (
          <div className="h-[calc(100vh-250px)]">
            {" "}
            {/* Ajusta la altura según tu layout */}
            <CourseWhiteboardTab courseId={id} />
          </div>
        )}
      </div>

      {/* Modal Unificado */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
              {activeTab === "Eventos"
                ? editingEvent
                  ? "✏️ Editar evento"
                  : "➕ Nuevo evento"
                : activeTab === "Tareas"
                  ? "📋 Nueva tarea"
                  : "📝 Nueva nota"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {activeTab === "Tareas" && (
                <>
                  <InputField
                    label="Título"
                    value={taskForm.title}
                    onChange={(v) => setTaskForm({ ...taskForm, title: v })}
                    required
                  />
                  <InputField
                    label="Descripción"
                    value={taskForm.description}
                    onChange={(v) =>
                      setTaskForm({ ...taskForm, description: v })
                    }
                  />
                  <SelectField
                    label="Estado"
                    value={taskForm.status}
                    onChange={(v) => setTaskForm({ ...taskForm, status: v })}
                    options={[
                      { value: "pendiente", label: "Pendiente" },
                      { value: "en_progreso", label: "En progreso" },
                      { value: "completada", label: "Completada" },
                    ]}
                  />
                  <InputField
                    label="Fecha límite"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(v) => setTaskForm({ ...taskForm, dueDate: v })}
                    required
                  />
                </>
              )}

              {activeTab === "Notas" && (
                <>
                  <InputField
                    label="Título"
                    value={noteForm.title}
                    onChange={(v) => setNoteForm({ ...noteForm, title: v })}
                    required
                  />
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                      Contenido
                    </label>
                    <textarea
                      value={noteForm.content}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, content: e.target.value })
                      }
                      rows={5}
                      className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                    />
                  </div>
                </>
              )}

              {activeTab === "Eventos" && (
                <>
                  <InputField
                    label="Título"
                    value={eventForm.title}
                    onChange={(v) => setEventForm({ ...eventForm, title: v })}
                    required
                  />
                  <SelectField
                    label="Tipo"
                    value={eventForm.type}
                    onChange={(v) => setEventForm({ ...eventForm, type: v })}
                    options={Object.entries(EVENT_TYPES).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                    }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Fecha inicio"
                      type="date"
                      value={eventForm.startDate}
                      onChange={(v) =>
                        setEventForm({ ...eventForm, startDate: v })
                      }
                      required
                    />
                    <InputField
                      label="Fecha fin (opcional)"
                      type="date"
                      value={eventForm.endDate}
                      onChange={(v) =>
                        setEventForm({ ...eventForm, endDate: v })
                      }
                    />
                  </div>
                  <InputField
                    label="Descripción"
                    value={eventForm.description}
                    onChange={(v) =>
                      setEventForm({ ...eventForm, description: v })
                    }
                  />
                </>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-gray-400 text-sm font-bold py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    createEventMutation.isPending ||
                    updateEventMutation.isPending ||
                    createTaskMutation.isPending ||
                    createNoteMutation.isPending
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {editingEvent && activeTab === "Eventos"
                    ? "Guardar cambios"
                    : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!deleteTaskId}
        title="¿Eliminar esta tarea?"
        message="Esta acción no se puede deshacer."
        onConfirm={() => deleteTaskMutation.mutate(deleteTaskId)}
        onCancel={() => setDeleteTaskId(null)}
        isPending={deleteTaskMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!deleteNoteId}
        title="¿Eliminar esta nota?"
        message="Esta acción no se puede deshacer."
        onConfirm={() => deleteNoteMutation.mutate(deleteNoteId)}
        onCancel={() => setDeleteNoteId(null)}
        isPending={deleteNoteMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!deleteEventId}
        title="¿Eliminar este evento?"
        message="Esta acción no se puede deshacer."
        onConfirm={() => deleteEventMutation.mutate(deleteEventId)}
        onCancel={() => setDeleteEventId(null)}
        isPending={deleteEventMutation.isPending}
      />
    </Layout>
  );
}

// Componentes auxiliares para limpiar el JSX
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-[#141414] border border-dashed border-[#2a2a2a] rounded-2xl text-center">
      <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center text-3xl mb-4"></div>
      <p className="text-gray-400 font-medium">{message}</p>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, required }) {
  return (
    <div>
      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all [color-scheme:dark]"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
